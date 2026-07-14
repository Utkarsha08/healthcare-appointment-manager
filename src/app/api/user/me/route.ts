export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        doctorProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Flatten doctor profile fields into the response if it's a doctor
    if (user.role === "DOCTOR" && user.doctorProfile) {
      return NextResponse.json({
        ...user,
        qualification: user.doctorProfile.qualification,
        experienceYears: user.doctorProfile.experienceYears,
        about: user.doctorProfile.about,
        consultationFee: user.doctorProfile.consultationFee,
        specialisation: user.doctorProfile.specialisation,
        googleEmail: user.doctorProfile.googleEmail,
        isGoogleConnected: !!user.doctorProfile.googleRefreshToken,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        }
      });
    }

    return NextResponse.json({
      ...user,
      isGoogleConnected: !!user.googleRefreshToken,
      googleEmail: user.googleEmail,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
