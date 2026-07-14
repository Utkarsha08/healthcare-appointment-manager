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
            patientEmail: string;
            patientName: string;
            doctorName: string;
            dateStr: string;
            recipientEmail: string;
            isForDoctor: boolean;
            userEmail: string;
            userName: string;
          };
          if (p.emailType === "APPOINTMENT_CONFIRMED") {
            await emailService.sendAppointmentConfirmation(p.patientEmail, p.patientName, p.doctorName, p.dateStr);
          } else if (p.emailType === "APPOINTMENT_CANCELLED") {
            await emailService.sendAppointmentCancellation(p.recipientEmail, p.patientName, p.doctorName, p.dateStr, p.isForDoctor);
          } else if (p.emailType === "PASSWORD_CHANGED") {
            await emailService.sendPasswordChangeEmail(p.userEmail, p.userName);
          } else {
            console.warn(`Unknown emailType ${p.emailType} for job ${job.id}`);
          }
        } else if (job.type === "APPOINTMENT_REMINDER") {
          // Future implementation
        } else if (job.type === "MEDICATION_REMINDER") {
          // Future implementation
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
