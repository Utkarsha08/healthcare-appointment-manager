"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function saveDoctor(doctorId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const specialisation = formData.get("specialisation") as string;
  const slotDurationMin = parseInt(formData.get("slotDurationMin") as string, 10);

  // Parse working hours
  const workingHours: Record<string, string[]> = {};
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  days.forEach((day) => {
    const start = formData.get(`${day}_start`) as string;
    const end = formData.get(`${day}_end`) as string;
    if (start && end) {
      workingHours[day] = [start, end];
    }
  });

  if (doctorId) {
    // Update existing doctor
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new Error("Doctor not found");

    await prisma.user.update({
      where: { id: doctor.userId },
      data: { name, email },
    });

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        specialisation,
        slotDurationMin,
        workingHours,
      },
    });
  } else {
    // Create new doctor
    const password = formData.get("password") as string;
    if (!password) throw new Error("Password is required for new doctors");

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            specialisation,
            slotDurationMin,
            workingHours,
          },
        },
      },
    });
  }

  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}

export async function addLeaveDay(
  doctorId: string,
  formData: FormData
) {
  const dateStr = formData.get("date") as string;
  const reason = formData.get("reason") as string;

  if (!dateStr) {
    throw new Error("Date is required");
  }

  // Store as date-only
  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);

  // We need to use a transaction to create the leave day, cancel existing appointments, 
  // and create notifications.
  const affectedAppointments = await prisma.$transaction(async (tx) => {
    // 1. Create the leave day
    await tx.leaveDay.create({
      data: {
        doctorId,
        date,
        reason,
      },
    });

    // 2. Find all CONFIRMED appointments for that doctor on that date
    // Date ranges from 00:00 to 23:59 of that day
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const appointmentsToCancel = await tx.appointment.findMany({
      where: {
        doctorId,
        status: "CONFIRMED",
        slotStart: {
          gte: date,
          lt: nextDay,
        },
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          }
        },
      },
    });

    if (appointmentsToCancel.length > 0) {
      // 3. Update status to LEAVE_CANCELLED
      await tx.appointment.updateMany({
        where: {
          id: { in: appointmentsToCancel.map((a) => a.id) },
        },
        data: {
          status: "LEAVE_CANCELLED",
        },
      });

      // 4. Create Notification rows via NotificationService
      const { notificationService } = await import("@/lib/services/notificationService");
      await notificationService.createLeaveCancellationNotifications(
        tx,
        appointmentsToCancel.map((a) => a.id),
        appointmentsToCancel.map((a) => a.patient.email || "")
      );

      // 5. Queue cancellation emails
      const { jobService } = await import("@/lib/services/jobService");
      const doctorName = appointmentsToCancel[0]?.doctor?.user?.name || "your doctor";
      
      for (const appt of appointmentsToCancel) {
        if (appt.patient.email) {
          const dateStr = new Date(appt.slotStart).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
          await jobService.queueEmail("APPOINTMENT_CANCELLED", {
            recipientEmail: appt.patient.email,
            patientName: appt.patient.name,
            doctorName,
            dateStr,
            isForDoctor: false
          }, tx);
        }
      }
    }

    return appointmentsToCancel;
  });

  // 6. Delete Calendar Events outside transaction
  if (affectedAppointments.length > 0) {
    const { calendarService } = await import("@/lib/services/calendarService");
    for (const appt of affectedAppointments) {
      if (appt.googleEventIdPatient || appt.googleEventIdDoctor) {
        await calendarService.deleteCalendarEvents(
          appt.googleEventIdPatient,
          appt.googleEventIdDoctor
        );
      }
    }
  }

  fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/process-jobs`).catch(() => {});

  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}

export async function deleteDoctor(doctorId: string) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return { error: "Doctor not found" };
    }

    // Check for future CONFIRMED appointments
    const futureConfirmedAppointments = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: "CONFIRMED",
        slotStart: {
          gte: new Date(),
        },
      },
    });

    if (futureConfirmedAppointments) {
      return { error: "Cannot delete doctor: there are future confirmed appointments." };
    }

    // Safely delete related records using a transaction
    await prisma.$transaction([
      prisma.leaveDay.deleteMany({ where: { doctorId } }),
      // Also delete any notification associated with the appointments of this doctor
      // Prisma doesn't support nested deleteMany inside a relation nicely unless cascading is setup, 
      // but we can delete Notifications where appointment.doctorId = doctorId first
      prisma.notification.deleteMany({
        where: {
          appointment: {
            doctorId,
          },
        },
      }),
      prisma.appointment.deleteMany({ where: { doctorId } }),
      prisma.doctor.delete({ where: { id: doctorId } }),
      prisma.user.delete({ where: { id: doctor.userId } }),
    ]);

    revalidatePath("/admin/doctors");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting doctor:", error);
    return { error: "Failed to delete doctor. Please try again." };
  }
}
