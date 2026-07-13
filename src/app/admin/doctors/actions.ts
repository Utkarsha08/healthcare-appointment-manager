"use server";

import { PrismaClient, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

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

  await prisma.leaveDay.create({
    data: {
      doctorId,
      date,
      reason,
    },
  });

  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}
