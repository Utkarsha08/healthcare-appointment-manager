import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { appointmentService } from "@/lib/services/appointmentService";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { doctorId, slotStart, slotDurationMin } = body;

    if (!doctorId || !slotStart || !slotDurationMin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await appointmentService.holdSlot(
      session.user.id,
      doctorId,
      slotStart,
      slotDurationMin
    );

    return NextResponse.json(appointment);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "This appointment slot has just been booked by another patient." },
        { status: 409 }
      );
    }
    console.error("Error holding slot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
