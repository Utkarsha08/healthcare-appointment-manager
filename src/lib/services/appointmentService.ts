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

    // 3. After Gemini finishes, start Transaction 1 to CONFIRM the appointment.
    const confirmedAppt = await prisma.$transaction(async (tx) => {
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
      return await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CONFIRMED",
          symptoms,
          preVisitSummary: preVisitSummary ? (preVisitSummary as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          holdExpiresAt: null, // Clear the hold expiry once confirmed
        },
        include: {
          patient: true,
          doctor: {
            include: {
              user: true,
            }
          }
        }
      });
    });

    // 4. Google Calendar API (Outside transaction, never blocks booking)
    const { calendarService } = await import("./calendarService");
    const { notificationService } = await import("./notificationService");

    const calendarResult = await calendarService.createCalendarEvents({
      patientName: confirmedAppt.patient.name || "Patient",
      patientEmail: confirmedAppt.patient.email || "",
      doctorName: confirmedAppt.doctor.user.name || "Doctor",
      doctorEmail: confirmedAppt.doctor.user.email || "",
      slotStart: confirmedAppt.slotStart,
      slotEnd: confirmedAppt.slotEnd,
      symptoms: confirmedAppt.symptoms || undefined,
    });

    // 5. Transaction 2: Save Google Event IDs and create notifications
    const finalAppt = await prisma.$transaction(async (tx) => {
      const updateData: { googleEventIdPatient?: string; googleEventIdDoctor?: string } = {};
      
      if (calendarResult.patientEventId) {
        updateData.googleEventIdPatient = calendarResult.patientEventId;
      }
      if (calendarResult.doctorEventId) {
        updateData.googleEventIdDoctor = calendarResult.doctorEventId;
      }

      let updatedAppt = confirmedAppt;

      if (Object.keys(updateData).length > 0) {
        updatedAppt = await tx.appointment.update({
          where: { id: appointmentId },
          data: updateData,
          include: {
            patient: true,
            doctor: {
              include: { user: true }
            }
          }
        });
      }

      await notificationService.createConfirmationNotification(
        tx,
        appointmentId,
        confirmedAppt.patient.email || "",
        confirmedAppt.doctor.user.email || "",
        confirmedAppt.doctor.user.name || "Doctor",
        confirmedAppt.patient.name || "Patient",
        new Date(confirmedAppt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      );

      return updatedAppt;
    });

    return finalAppt;
  },

  async cancelBooking(appointmentId: string, patientId: string) {
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    if (!appt || appt.patientId !== patientId) {
      throw new Error("Appointment not found or unauthorized");
    }

    if (appt.status !== "CONFIRMED") {
      throw new Error("Can only cancel confirmed appointments");
    }

    const cancelledAppt = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CANCELLED" },
      });

      const { notificationService } = await import("./notificationService");
      
      const dateStr = new Date(appt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      
      await notificationService.createPatientCancellationNotification(
        tx,
        appointmentId,
        appt.doctor.user.email || "",
        appt.patient.name || "Patient",
        dateStr
      );

      return updated;
    });

    // Delete calendar events
    if (appt.googleEventIdPatient || appt.googleEventIdDoctor) {
      const { calendarService } = await import("./calendarService");
      await calendarService.deleteCalendarEvents(
        appt.googleEventIdPatient || null,
        appt.googleEventIdDoctor || null
      );
    }

    return cancelledAppt;
  }
};
