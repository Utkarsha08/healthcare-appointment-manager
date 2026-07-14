import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calendarService } from "@/lib/services/calendarService";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!doctor) {
    return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
  }

  try {
    await calendarService.disconnect(doctor.id);
    return NextResponse.json({ message: "Disconnected successfully" });
  } catch (error) {
    console.error("Disconnect Error:", error);
    return NextResponse.json({ error: "Failed to disconnect calendar" }, { status: 500 });
  }
}
