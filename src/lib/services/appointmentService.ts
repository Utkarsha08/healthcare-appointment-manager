import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { aiProvider } from "@/lib/ai/gemini";
import { generateAvailableSlots } from "@/lib/services/slotService";

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

    if (initialAppt.status === "CONFIRMED") {
      throw new Error("ALREADY_CONFIRMED");
    }

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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const isTransient = 
        errMsg.includes("429") || 
        errMsg.includes("503") || 
        errMsg.includes("RESOURCE_EXHAUSTED") || 
        errMsg.includes("UNAVAILABLE");

      if (isTransient) {
        console.warn(`[AI Warning] Gemini is temporarily unavailable (Quota/Transient). Proceeding without AI summary.`);
      } else {
        console.error("Gemini failed during confirmBooking:", error);
      }
      
      preVisitSummary = null;
    }

    // 4. Update appointment status inside transaction
    const finalAppt = await prisma.$transaction(async (tx) => {
      // Re-read the appointment inside the transaction.
      const appt = await tx.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!appt) throw new Error("Appointment not found");

      // Verify it is still HELD.
      if (appt.status === "CONFIRMED") {
        throw new Error("ALREADY_CONFIRMED");
      }

      if (appt.status !== "HELD") {
        throw new Error("Appointment is no longer in HELD status");
      }

      // Verify it has not expired.
      if (appt.holdExpiresAt && new Date(appt.holdExpiresAt) < new Date()) {
        throw new Error("EXPIRED");
      }

      // Update appointment to CONFIRMED.
      const updatedAppt = await tx.appointment.update({
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

      const { notificationService } = await import("./notificationService");
      await notificationService.createConfirmationNotification(
        tx,
        appointmentId,
        updatedAppt.patient.email || "",
        updatedAppt.doctor.user.email || "",
        updatedAppt.doctor.user.name || "Doctor",
        updatedAppt.patient.name || "Patient",
        new Date(updatedAppt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      );

      const { jobService } = await import("./jobService");
      
      const dateStr = new Date(updatedAppt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

      // Queue confirmation email for PATIENT
      await jobService.queueEmail("APPOINTMENT_CONFIRMED", {
        recipientEmail: updatedAppt.patient.email,
        patientName: updatedAppt.patient.name,
        doctorName: updatedAppt.doctor.user.name,
        doctorSpecialization: updatedAppt.doctor.specialisation,
        symptoms: updatedAppt.symptoms,
        dateStr,
        isForDoctor: false
      }, tx);

      // Queue confirmation email for DOCTOR
      await jobService.queueEmail("APPOINTMENT_CONFIRMED", {
        recipientEmail: updatedAppt.doctor.user.email,
        patientName: updatedAppt.patient.name,
        doctorName: updatedAppt.doctor.user.name,
        doctorSpecialization: updatedAppt.doctor.specialisation,
        symptoms: updatedAppt.symptoms,
        dateStr,
        isForDoctor: true
      }, tx);

      // Queue reminder emails (execute 24 hours before slotStart)
      const reminderLeadTimeHours = parseInt(process.env.REMINDER_LEAD_TIME_HOURS || "24", 10);
      const executeAt = new Date(updatedAppt.slotStart.getTime() - reminderLeadTimeHours * 60 * 60 * 1000);
      
      // Only queue if it's in the future
      if (executeAt > new Date()) {
        await jobService.queueEmail("APPOINTMENT_REMINDER", {
          appointmentId,
          targetSlotStart: updatedAppt.slotStart.toISOString(),
          recipientEmail: updatedAppt.patient.email,
          patientName: updatedAppt.patient.name,
          doctorName: updatedAppt.doctor.user.name,
          dateStr,
          isForDoctor: false
        }, tx, executeAt);

        await jobService.queueEmail("APPOINTMENT_REMINDER", {
          appointmentId,
          targetSlotStart: updatedAppt.slotStart.toISOString(),
          recipientEmail: updatedAppt.doctor.user.email,
          patientName: updatedAppt.patient.name,
          doctorName: updatedAppt.doctor.user.name,
          dateStr,
          isForDoctor: true
        }, tx, executeAt);
      }

      // Queue calendar sync for DOCTOR
      await jobService.queueCalendarSync("CREATE", {
        appointmentId,
        doctorId: updatedAppt.doctorId,
        patientId: updatedAppt.patientId,
        patientName: updatedAppt.patient.name,
        patientEmail: updatedAppt.patient.email,
        doctorName: updatedAppt.doctor.user.name,
        doctorEmail: updatedAppt.doctor.user.email,
        slotStart: updatedAppt.slotStart.toISOString(),
        slotEnd: updatedAppt.slotEnd.toISOString(),
        symptoms: updatedAppt.symptoms,
        isForDoctor: true,
      }, tx);

      // Queue calendar sync for PATIENT
      await jobService.queueCalendarSync("CREATE", {
        appointmentId,
        doctorId: updatedAppt.doctorId,
        patientId: updatedAppt.patientId,
        patientName: updatedAppt.patient.name,
        patientEmail: updatedAppt.patient.email,
        doctorName: updatedAppt.doctor.user.name,
        doctorEmail: updatedAppt.doctor.user.email,
        slotStart: updatedAppt.slotStart.toISOString(),
        slotEnd: updatedAppt.slotEnd.toISOString(),
        symptoms: updatedAppt.symptoms,
        isForDoctor: false,
      }, tx);

      return updatedAppt;
    });

    // We can also fire an asynchronous, background fetch to our cron endpoint to process it immediately,
    // or just let the actual cron handle it. For immediate best-effort delivery:
    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/process-jobs`).catch(() => {});

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

      // Queue cancellation email for DOCTOR
      const { jobService } = await import("./jobService");
      await jobService.queueEmail("APPOINTMENT_CANCELLED", {
        recipientEmail: appt.doctor.user.email,
        patientName: appt.patient.name,
        doctorName: appt.doctor.user.name,
        dateStr,
        isForDoctor: true
      }, tx);

      // Queue cancellation email for PATIENT
      await jobService.queueEmail("APPOINTMENT_CANCELLED", {
        recipientEmail: appt.patient.email,
        patientName: appt.patient.name,
        doctorName: appt.doctor.user.name,
        dateStr,
        isForDoctor: false
      }, tx);

      // Queue calendar sync for deletion (Doctor)
      if (appt.googleEventIdDoctor) {
        await jobService.queueCalendarSync("DELETE", {
          appointmentId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          eventId: appt.googleEventIdDoctor,
          isForDoctor: true,
        }, tx);
      }

      // Queue calendar sync for deletion (Patient)
      if (appt.googleEventIdPatient) {
        await jobService.queueCalendarSync("DELETE", {
          appointmentId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          eventId: appt.googleEventIdPatient,
          isForDoctor: false,
        }, tx);
      }

      return updated;
    });

    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/process-jobs`).catch(() => {});

    return cancelledAppt;
  },

  async rescheduleBooking(appointmentId: string, patientId: string, newSlotStartIso: string, slotDurationMin: number) {
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
      throw new Error("Can only reschedule confirmed appointments");
    }

    if (new Date(appt.slotStart) <= new Date()) {
      throw new Error("Cannot reschedule past appointments");
    }

    const newSlotStart = new Date(newSlotStartIso);
    if (newSlotStart <= new Date()) {
      throw new Error("New slot must be in the future");
    }

    if (appt.slotStart.toISOString() === newSlotStart.toISOString()) {
      throw new Error("New slot is identical to current slot");
    }

    const targetDate = new Date(newSlotStartIso);
    targetDate.setUTCHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const leaveDays = await prisma.leaveDay.findMany({
      where: {
        doctorId: appt.doctorId,
        date: { gte: targetDate, lt: nextDay },
      },
    });

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: appt.doctorId,
        id: { not: appointmentId }, // exclude current appointment
        slotStart: { gte: targetDate, lt: nextDay },
        status: { in: ["HELD", "CONFIRMED", "COMPLETED"] },
      },
    });

    const slots = generateAvailableSlots(
      targetDate,
      appt.doctor.workingHours,
      appt.doctor.slotDurationMin,
      leaveDays,
      existingAppointments
    );

    if (!slots.includes(newSlotStart.toISOString())) {
      throw new Error("Selected slot is not available");
    }

    const newSlotEnd = new Date(newSlotStart.getTime() + slotDurationMin * 60000);

    const updatedAppt = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          slotStart: newSlotStart,
          slotEnd: newSlotEnd,
        },
      });

      const { jobService } = await import("./jobService");

      const oldDateStr = new Date(appt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
      const newDateStr = new Date(newSlotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

      // Queue reschedule email for PATIENT
      await jobService.queueEmail("APPOINTMENT_RESCHEDULED", {
        recipientEmail: appt.patient.email,
        patientName: appt.patient.name,
        doctorName: appt.doctor.user.name,
        oldDateStr,
        newDateStr,
        isForDoctor: false
      }, tx);

      // Queue reschedule email for DOCTOR
      await jobService.queueEmail("APPOINTMENT_RESCHEDULED", {
        recipientEmail: appt.doctor.user.email,
        patientName: appt.patient.name,
        doctorName: appt.doctor.user.name,
        oldDateStr,
        newDateStr,
        isForDoctor: true
      }, tx);

      // Queue new reminder emails
      const reminderLeadTimeHours = parseInt(process.env.REMINDER_LEAD_TIME_HOURS || "24", 10);
      const executeAt = new Date(newSlotStart.getTime() - reminderLeadTimeHours * 60 * 60 * 1000);
      
      if (executeAt > new Date()) {
        await jobService.queueEmail("APPOINTMENT_REMINDER", {
          appointmentId,
          targetSlotStart: newSlotStart.toISOString(),
          recipientEmail: appt.patient.email,
          patientName: appt.patient.name,
          doctorName: appt.doctor.user.name,
          dateStr: newDateStr,
          isForDoctor: false
        }, tx, executeAt);

        await jobService.queueEmail("APPOINTMENT_REMINDER", {
          appointmentId,
          targetSlotStart: newSlotStart.toISOString(),
          recipientEmail: appt.doctor.user.email,
          patientName: appt.patient.name,
          doctorName: appt.doctor.user.name,
          dateStr: newDateStr,
          isForDoctor: true
        }, tx, executeAt);
      }

      // Queue calendar sync UPDATE for Doctor
      if (appt.googleEventIdDoctor) {
        await jobService.queueCalendarSync("UPDATE", {
          appointmentId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          patientName: appt.patient.name,
          patientEmail: appt.patient.email,
          doctorName: appt.doctor.user.name,
          doctorEmail: appt.doctor.user.email,
          slotStart: newSlotStart.toISOString(),
          slotEnd: newSlotEnd.toISOString(),
          symptoms: appt.symptoms || undefined,
          eventId: appt.googleEventIdDoctor,
          isForDoctor: true,
        }, tx);
      }

      // Queue calendar sync UPDATE for Patient
      if (appt.googleEventIdPatient) {
        await jobService.queueCalendarSync("UPDATE", {
          appointmentId,
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          patientName: appt.patient.name,
          patientEmail: appt.patient.email,
          doctorName: appt.doctor.user.name,
          doctorEmail: appt.doctor.user.email,
          slotStart: newSlotStart.toISOString(),
          slotEnd: newSlotEnd.toISOString(),
          symptoms: appt.symptoms || undefined,
          eventId: appt.googleEventIdPatient,
          isForDoctor: false,
        }, tx);
      }

      return updated;
    });

    fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/process-jobs`).catch(() => {});

    return updatedAppt;
  }
};
