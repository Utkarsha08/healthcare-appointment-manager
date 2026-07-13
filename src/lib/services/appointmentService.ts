import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { aiProvider } from "@/lib/ai/gemini";

export const appointmentService = {
  async holdSlot(patientId: string, doctorId: string, slotStartIso: string, slotDurationMin: number) {
    const slotStart = new Date(slotStartIso);
    const slotEnd = new Date(slotStart.getTime() + slotDurationMin * 60000);
    const holdExpiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes hold

    return await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        slotStart,
        slotEnd,
        status: "HELD",
        holdExpiresAt,
      },
    });
  },

  async confirmBooking(appointmentId: string, symptoms: string) {
    return await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appt) throw new Error("Appointment not found");

      if (appt.status !== "HELD") {
        throw new Error("Appointment is no longer in HELD status");
      }

      if (appt.holdExpiresAt && new Date(appt.holdExpiresAt) < new Date()) {
        throw new Error("EXPIRED");
      }

      // Call Gemini inside service, with fallback to null
      const preVisitSummary = await aiProvider.generatePreVisitSummary(symptoms);

      // We use 'as any' for preVisitSummary because Prisma's Json type is strict 
      // but passing an object works.
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CONFIRMED",
          symptoms,
          preVisitSummary: preVisitSummary ? (preVisitSummary as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          holdExpiresAt: null, // Clear the hold expiry once confirmed
        },
      });

      return updated;
    });
  },
};
