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
    const { appointmentId, symptoms } = body;

    if (!appointmentId || !symptoms) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await appointmentService.confirmBooking(appointmentId, symptoms);

    return NextResponse.json(appointment);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_CONFIRMED") {
        return NextResponse.json({ message: "Appointment is already confirmed.", alreadyConfirmed: true }, { status: 200 });
      }
      if (error.message === "EXPIRED") {
        return NextResponse.json({ error: "Your reservation has expired." }, { status: 410 });
      }
    }
    console.error("Error confirming booking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
