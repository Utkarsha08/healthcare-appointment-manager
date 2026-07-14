import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { aiProvider } from "@/lib/ai/gemini";
import { PreVisitSummary } from "@/lib/ai/types";

export type TodayAppointment = {
  id: string;
  slotStart: Date;
  slotEnd: Date;
  symptoms: string | null;
  preVisitSummary: PreVisitSummary | null;
  status: string;
  patient: {
    name: string;
  };
};

export interface PrescriptionMedicine {
  medicine: string;
  dosage: string;
  frequency: string;
  durationDays: number;
}

export const doctorService = {
  async getTodayAppointments(userId: string): Promise<TodayAppointment[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor: {
          userId,
        },
        status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED"] },
        slotStart: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        slotStart: true,
        slotEnd: true,
        symptoms: true,
        preVisitSummary: true,
        status: true,
        patient: {
          select: {
            name: true,
          }
        }
      },
      orderBy: {
        slotStart: "asc",
      },
    });

    appointments.sort((a, b) => {
      const order: Record<string, number> = { CONFIRMED: 0, HELD: 1, COMPLETED: 2, CANCELLED: 3, LEAVE_CANCELLED: 3 };
      const statusDiff = (order[a.status] ?? 4) - (order[b.status] ?? 4);
      if (statusDiff !== 0) return statusDiff;
      return a.slotStart.getTime() - b.slotStart.getTime();
    });

    return appointments.map((apt) => ({
      ...apt,
      preVisitSummary: apt.preVisitSummary as unknown as PreVisitSummary | null,
    }));
  },

  async saveConsultation(
    appointmentId: string,
    doctorId: string,
    doctorNotes: string,
    prescription: PrescriptionMedicine[]
  ) {
    // 1. Validate appointment and ownership
    const initialAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
      },
    });

    if (!initialAppt) {
      throw new Error("Appointment not found");
    }

    if (initialAppt.doctor.userId !== doctorId) {
      throw new Error("Unauthorized");
    }

    if (initialAppt.status !== "CONFIRMED") {
      throw new Error("Appointment is not CONFIRMED");
    }

    // 2. Generate Gemini summary outside transaction
    let postVisitSummary: string | null = null;

    if (doctorNotes.trim().length > 0) {
      postVisitSummary = await aiProvider.generatePostVisitSummary(doctorNotes);
    }

    // 3. Save atomically
    return await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: true,
          patient: true,
        },
      });

      if (!appt) {
        throw new Error("Appointment not found");
      }

      if (appt.doctor.userId !== doctorId) {
        throw new Error("Unauthorized");
      }

      if (appt.status !== "CONFIRMED") {
        throw new Error("Appointment is no longer CONFIRMED");
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          doctorNotes,
          prescription:
            prescription as unknown as Prisma.InputJsonValue,
          postVisitSummary,
          status: "COMPLETED",
        },
      });

      const { notificationService } = await import("./notificationService");
      await notificationService.createConsultationCompletedNotification(
        tx,
        appointmentId,
        appt.patient.email || ""
      );

      return updated;
    });
  }
};
