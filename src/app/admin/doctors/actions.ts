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
    }

    return appointmentsToCancel;
  });

  // 5. Delete Calendar Events outside transaction
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

  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}
