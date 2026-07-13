import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAvailableSlots } from "@/lib/services/slotService";

export async function GET(
  request: Request,
  { params }: { params: { doctorId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    
    if (!dateStr) {
      return NextResponse.json({ error: "Date is required (YYYY-MM-DD)" }, { status: 400 });
    }

    const targetDate = new Date(dateStr);
    targetDate.setUTCHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    // 1. Fetch doctor working hours and slot duration
    const doctor = await prisma.doctor.findUnique({
      where: { id: params.doctorId },
      select: { workingHours: true, slotDurationMin: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // 2. Fetch leave days overlapping this date
    const leaveDays = await prisma.leaveDay.findMany({
      where: {
        doctorId: params.doctorId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    // 3. Fetch existing appointments
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: params.doctorId,
        slotStart: {
          gte: targetDate,
          lt: nextDay,
        },
        status: {
          in: ["HELD", "CONFIRMED", "COMPLETED"],
        },
      },
    });

    // 4. Generate slots using service
    const slots = generateAvailableSlots(
      targetDate,
      doctor.workingHours,
      doctor.slotDurationMin,
      leaveDays,
      existingAppointments
    );

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error generating slots:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
