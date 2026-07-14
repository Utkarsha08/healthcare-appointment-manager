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
          doctor: { include: { user: true } },
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

      // Queue Medication Reminders
      if (prescription && Array.isArray(prescription) && prescription.length > 0) {
        const { jobService } = await import("./jobService");
        
        for (const med of (prescription as PrescriptionMedicine[])) {
          if (!med.durationDays || med.durationDays <= 0) continue;
          
          const times = parseFrequencyTimes(med.frequency || "");
          const today = new Date();
          // Start from tomorrow, or today if it's early enough (simplified to start tomorrow for safety)
          
          for (let i = 1; i <= med.durationDays; i++) {
            const dayDate = new Date(today);
            dayDate.setDate(dayDate.getDate() + i);
            
            for (const hour of times) {
              const executeAt = new Date(dayDate);
              executeAt.setHours(hour, 0, 0, 0);
              
              if (executeAt > new Date()) {
                await jobService.queueMedicationReminder({
                  appointmentId,
                  patientId: appt.patient.id,
                  medicine: med.medicine,
                  dosage: med.dosage,
                  frequency: med.frequency,
                  doctorName: appt.doctor.user.name,
                }, tx, executeAt);
              }
            }
          }
        }
      }

      return updated;
    });
  }
};

function parseFrequencyTimes(frequency: string): number[] {
  const f = frequency.toLowerCase();
  
  const parts = f.split('-');
  if (parts.length === 3) {
    const times: number[] = [];
    if (parseInt(parts[0]) > 0) times.push(8); // 8 AM
    if (parseInt(parts[1]) > 0) times.push(13); // 1 PM
    if (parseInt(parts[2]) > 0) times.push(20); // 8 PM
    if (times.length > 0) return times;
  }
  
  if (f.includes("twice") || f.includes("2")) return [8, 20];
  if (f.includes("thrice") || f.includes("3") || f.includes("three")) return [8, 13, 20];
  if (f.includes("four") || f.includes("4")) return [8, 12, 16, 20];
  if (f.includes("night") || f.includes("bed")) return [21];
  if (f.includes("afternoon")) return [13];
  
  // Default safely to 8 AM
  return [8];
}
