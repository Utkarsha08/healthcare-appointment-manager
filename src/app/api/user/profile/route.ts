import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const userId = session.user.id;

    if (session.user.role === "PATIENT") {
      const { name, dateOfBirth, gender, phone, bloodGroup, address, emergencyContactName, emergencyContactPhone } = data;
      await prisma.user.update({
        where: { id: userId },
        data: {
          name,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phone,
          bloodGroup: bloodGroup || null,
          address: address || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
        },
      });
    } else if (session.user.role === "DOCTOR") {
      const { name, qualification, experienceYears, phone, about, consultationFee } = data;
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { name, phone },
        });
        await tx.doctor.update({
          where: { userId },
          data: {
            qualification: qualification || null,
            experienceYears: experienceYears ? parseInt(experienceYears, 10) : null,
            about: about || null,
            consultationFee: consultationFee ? parseInt(consultationFee, 10) : null,
            phone: phone || null,
          },
        });
      });
    } else if (session.user.role === "ADMIN") {
      const { name } = data;
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
