import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { doctorService } from "@/lib/services/doctorService";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const doctorId = session.user.id;

    if (!doctorId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { doctorNotes, prescription } = await req.json();

    if (typeof doctorNotes !== "string") {
      return NextResponse.json(
        { error: "Invalid doctorNotes" },
        { status: 400 }
      );
    }

    if (!Array.isArray(prescription)) {
      return NextResponse.json(
        { error: "Invalid prescription format" },
        { status: 400 }
      );
    }

    const updatedAppointment = await doctorService.saveConsultation(
      params.id,
      doctorId,
      doctorNotes,
      prescription
    );

    return NextResponse.json(updatedAppointment, { status: 200 });
  } catch (error: unknown) {
    console.error("Failed to complete appointment:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}