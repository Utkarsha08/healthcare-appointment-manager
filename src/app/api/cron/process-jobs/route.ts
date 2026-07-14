import { NextResponse } from "next/server";
import { jobService } from "@/lib/services/jobService";
import { emailService } from "@/lib/services/emailService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const jobs = await jobService.getPendingJobs();
    
    if (jobs.length === 0) {
      return NextResponse.json({ message: "No jobs to process" });
    }

    const results = [];

    for (const job of jobs) {
      try {
        if (job.type === "EMAIL_RETRY") {
          const p = job.payload as {
            emailType: string;
            patientEmail?: string;
            patientName: string;
            doctorName: string;
            dateStr: string;
            recipientEmail?: string;
            isForDoctor?: boolean;
            userEmail?: string;
            userName?: string;
            doctorSpecialization?: string;
            symptoms?: string;
            oldDateStr?: string;
            newDateStr?: string;
            appointmentId?: string;
            targetSlotStart?: string;
          };
          if (p.emailType === "APPOINTMENT_CONFIRMED") {
            await emailService.sendAppointmentConfirmation(p.recipientEmail!, p.patientName, p.doctorName, p.doctorSpecialization!, p.dateStr, p.symptoms, p.isForDoctor!);
          } else if (p.emailType === "APPOINTMENT_CANCELLED") {
            await emailService.sendAppointmentCancellation(p.recipientEmail!, p.patientName, p.doctorName, p.dateStr, p.isForDoctor!);
          } else if (p.emailType === "APPOINTMENT_RESCHEDULED") {
            await emailService.sendAppointmentRescheduled(p.recipientEmail!, p.patientName, p.doctorName, p.oldDateStr!, p.newDateStr!, p.isForDoctor!);
          } else if (p.emailType === "APPOINTMENT_REMINDER") {
            const { prisma } = await import("@/lib/prisma");
            const appt = await prisma.appointment.findUnique({ where: { id: p.appointmentId! } });
            
            // Stateless validation: Only send if appointment is still CONFIRMED and slotStart hasn't changed.
            if (appt && appt.status === "CONFIRMED" && appt.slotStart.toISOString() === p.targetSlotStart) {
              await emailService.sendAppointmentReminder(p.recipientEmail!, p.patientName, p.doctorName, p.dateStr, p.isForDoctor!);
            } else {
              console.log(`Skipping outdated reminder for appointment ${p.appointmentId}`);
            }
          } else if (p.emailType === "PASSWORD_CHANGED") {
            await emailService.sendPasswordChangeEmail(p.userEmail!, p.userName!);
          } else {
            console.warn(`Unknown emailType ${p.emailType} for job ${job.id}`);
          }
        } else if (job.type === "CALENDAR_SYNC_RETRY") {
          const p = job.payload as {
            action: string;
            doctorId: string;
            patientId: string;
            appointmentId: string;
            patientName: string;
            patientEmail: string;
            doctorName: string;
            doctorEmail: string;
            slotStart: string;
            slotEnd: string;
            symptoms?: string;
            eventId: string;
            isForDoctor: boolean;
          };
          const { calendarService } = await import("@/lib/services/calendarService");
          
          if (p.action === "CREATE") {
            const details = {
              patientName: p.patientName,
              patientEmail: p.patientEmail,
              doctorName: p.doctorName,
              doctorEmail: p.doctorEmail,
              slotStart: new Date(p.slotStart),
              slotEnd: new Date(p.slotEnd),
              symptoms: p.symptoms,
            };
            const eventId = p.isForDoctor 
              ? await calendarService.createCalendarEvent(p.doctorId, details)
              : await calendarService.createPatientCalendarEvent(p.patientId, details);

            if (eventId) {
              const { prisma } = await import("@/lib/prisma");
              await prisma.appointment.update({
                where: { id: p.appointmentId },
                data: p.isForDoctor ? { googleEventIdDoctor: eventId } : { googleEventIdPatient: eventId },
              });
            }
          } else if (p.action === "DELETE") {
            const { prisma } = await import("@/lib/prisma");
            if (p.isForDoctor) {
              await calendarService.deleteCalendarEvent(p.doctorId, p.eventId);
              await prisma.appointment.update({
                where: { id: p.appointmentId },
                data: { googleEventIdDoctor: null },
              });
            } else {
              await calendarService.deletePatientCalendarEvent(p.patientId, p.eventId);
              await prisma.appointment.update({
                where: { id: p.appointmentId },
                data: { googleEventIdPatient: null },
              });
            }
          } else if (p.action === "UPDATE") {
            const details = {
              patientName: p.patientName,
              patientEmail: p.patientEmail,
              doctorName: p.doctorName,
              doctorEmail: p.doctorEmail,
              slotStart: new Date(p.slotStart),
              slotEnd: new Date(p.slotEnd),
              symptoms: p.symptoms,
            };
            if (p.isForDoctor) {
              await calendarService.updateCalendarEvent(p.doctorId, p.eventId, details);
            } else {
              await calendarService.updatePatientCalendarEvent(p.patientId, p.eventId, details);
            }
          }
        } else if (job.type === "MEDICATION_REMINDER") {
          const p = job.payload as {
            appointmentId: string;
            patientId: string;
            medicine: string;
            dosage: string;
            frequency: string;
            doctorName: string;
          };
          
          const { prisma } = await import("@/lib/prisma");
          const appt = await prisma.appointment.findUnique({
            where: { id: p.appointmentId },
            include: { patient: true }
          });
          
          if (appt && appt.status === "COMPLETED") {
            await prisma.notification.create({
              data: {
                appointmentId: p.appointmentId,
                recipient: appt.patient.email || "",
                type: "MEDICATION_REMINDER",
                title: "💊 Medication Reminder",
                message: `Time to take ${p.medicine} (${p.dosage}). Frequency: ${p.frequency}. Prescribed by Dr. ${p.doctorName}.`,
                isRead: false
              }
            });
          } else {
            console.log(`Skipping medication reminder: appointment ${p.appointmentId} is no longer completed or does not exist.`);
          }
        } else {
          console.warn(`Unknown job type ${job.type} for job ${job.id}`);
        }

        await jobService.markJobCompleted(job.id);
        results.push({ id: job.id, status: "COMPLETED" });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Job ${job.id} failed:`, err);
        await jobService.markJobFailed(job.id, errorMsg);
        results.push({ id: job.id, status: "FAILED", error: errorMsg });
      }
    }

    return NextResponse.json({ message: "Processed jobs", results });
  } catch (error) {
    console.error("Cron process-jobs error:", error);
    return NextResponse.json(
      { error: "Failed to process jobs" },
      { status: 500 }
    );
  }
}
