import { NextResponse } from "next/server";
import { calendarService } from "@/lib/services/calendarService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=invalid_oauth_response", request.url));
  }

  try {
    const [role, id] = state.split(":");

    if (role === "doctor") {
      await calendarService.handleCallback(code, id);
      return NextResponse.redirect(new URL("/doctor/profile?success=calendar_connected", request.url));
    } else if (role === "patient") {
      await calendarService.handleCallbackPatient(code, id);
      return NextResponse.redirect(new URL("/patient/profile?success=calendar_connected", request.url));
    } else {
      throw new Error("Invalid role in state");
    }
  } catch (error) {
    console.error("Google Calendar OAuth Error:", error);
    const redirectUrl = state.startsWith("patient:") ? "/patient/profile" : "/doctor/profile";
    return NextResponse.redirect(new URL(`${redirectUrl}?error=oauth_failed`, request.url));
  }
}
