"use server";

import { appointmentService } from "@/lib/services/appointmentService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function cancelPatientAppointment(appointmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return { error: "Unauthorized" };
    }

    await appointmentService.cancelBooking(appointmentId, session.user.id);
    
    revalidatePath("/patient");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error cancelling appointment:", error);
    return { error: error instanceof Error ? error.message : "Failed to cancel appointment" };
  }
}

export async function reschedulePatientAppointment(appointmentId: string, newSlotStartIso: string, slotDurationMin: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PATIENT") {
      return { error: "Unauthorized" };
    }

    await appointmentService.rescheduleBooking(appointmentId, session.user.id, newSlotStartIso, slotDurationMin);
    
    revalidatePath("/patient");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error rescheduling appointment:", error);
    return { error: error instanceof Error ? error.message : "Failed to reschedule appointment" };
  }
}
