import { prisma } from "@/lib/prisma";
import { PreVisitSummary } from "@/lib/ai/types";

export type TodayAppointment = {
  id: string;
  slotStart: Date;
  slotEnd: Date;
  symptoms: string | null;
  preVisitSummary: PreVisitSummary | null;
  patient: {
    name: string;
  };
};

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
        status: "CONFIRMED",
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

    return appointments.map((apt) => ({
      ...apt,
      preVisitSummary: apt.preVisitSummary as unknown as PreVisitSummary | null,
    }));
  }
};
