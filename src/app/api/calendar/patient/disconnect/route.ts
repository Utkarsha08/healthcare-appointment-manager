import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calendarService } from "@/lib/services/calendarService";
import { Role } from "@prisma/client";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await calendarService.disconnectPatient(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }
}
