"use server";

import { prisma } from "@/lib/prisma";

export async function deletePatientAccount(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "PATIENT") {
      return { error: "Patient not found" };
    }

    // Safely delete associated records using a transaction
    await prisma.$transaction([
      prisma.notification.deleteMany({
        where: {
          appointment: {
            patientId: userId,
          },
        },
      }),
      prisma.appointment.deleteMany({ where: { patientId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting patient account:", error);
    return { error: "Failed to delete account. Please try again." };
  }
}
