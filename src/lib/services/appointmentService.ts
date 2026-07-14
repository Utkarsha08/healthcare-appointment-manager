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
    // 1. Validate the HELD appointment outside transaction first
    const initialAppt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!initialAppt) throw new Error("Appointment not found");

    if (initialAppt.status !== "HELD") {
      throw new Error("Appointment is no longer in HELD status");
    }

    if (initialAppt.holdExpiresAt && new Date(initialAppt.holdExpiresAt) < new Date()) {
      throw new Error("EXPIRED");
    }

    // 2. Call Gemini outside any transaction with graceful AI fallback
    let preVisitSummary = null;
    try {
      preVisitSummary = await aiProvider.generatePreVisitSummary(symptoms);
    } catch (error) {
      // If Gemini fails, use null
      console.error("Gemini failed during confirmBooking:", error);
      preVisitSummary = null;
    }

    // 3. After Gemini finishes, start prisma.$transaction().
    return await prisma.$transaction(async (tx) => {
      // Re-read the appointment inside the transaction.
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appt) throw new Error("Appointment not found");

      // Verify it is still HELD.
      if (appt.status !== "HELD") {
        throw new Error("Appointment is no longer in HELD status");
      }

      // Verify it has not expired.
      if (appt.holdExpiresAt && new Date(appt.holdExpiresAt) < new Date()) {
        throw new Error("EXPIRED");
      }

      // Update appointment to CONFIRMED.
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
