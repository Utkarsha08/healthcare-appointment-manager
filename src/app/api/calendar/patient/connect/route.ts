import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calendarService } from "@/lib/services/calendarService";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.PATIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = calendarService.getAuthUrlPatient(session.user.id);
  return NextResponse.redirect(url);
}
