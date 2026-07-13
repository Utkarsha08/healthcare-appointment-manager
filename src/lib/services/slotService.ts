import { Appointment, LeaveDay, Prisma } from "@prisma/client";

export function generateAvailableSlots(
  targetDate: Date,
  workingHours: Prisma.JsonValue,
  slotDurationMin: number,
  leaveDays: LeaveDay[],
  existingAppointments: Appointment[]
): string[] {
  // 1. Check if the entire day is a leave day
  const isLeaveDay = leaveDays.some(
    (ld) => ld.date.toISOString().split("T")[0] === targetDate.toISOString().split("T")[0]
  );
  if (isLeaveDay) return [];

  // 2. Get the day of the week (e.g. "mon", "tue")
  const dayIndex = targetDate.getUTCDay(); // 0 = Sun, 1 = Mon, etc.
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayName = days[dayIndex];

  // 3. Extract working hours for that day
  const hoursObj = workingHours as Record<string, unknown> | null;
  const hours = hoursObj?.[dayName] as [string, string] | undefined;
  if (!hours || hours.length !== 2) return [];

  const [startStr, endStr] = hours;

  // 4. Create bounds
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const startTime = new Date(targetDate);
  startTime.setUTCHours(startH, startM, 0, 0);

  const endTime = new Date(targetDate);
  endTime.setUTCHours(endH, endM, 0, 0);

  const slots: string[] = [];
  const now = new Date();

  // 5. Generate slots iteratively
  let currentSlot = new Date(startTime);

  while (currentSlot < endTime) {
    const slotStart = new Date(currentSlot);
    const slotEnd = new Date(currentSlot.getTime() + slotDurationMin * 60000);

    if (slotEnd > endTime) break;

    // Filter past slots
    if (slotStart <= now) {
      currentSlot = slotEnd;
      continue;
    }

    // Filter colliding existing appointments
    const isConflict = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.slotStart);
      
      // Strict equality based on exact time slot start works for fixed durations
      // but let's check overlap for safety
      if (slotStart >= apptStart && slotStart < new Date(appt.slotEnd)) return true;
      
      // If it's HELD and hold hasn't expired yet
      if (appt.status === "HELD" && appt.holdExpiresAt && new Date(appt.holdExpiresAt) > now) {
        if (slotStart >= apptStart && slotStart < new Date(appt.slotEnd)) return true;
      }
      return false;
    });

    if (!isConflict) {
      slots.push(slotStart.toISOString());
    }

    currentSlot = slotEnd;
  }

  return slots;
}
