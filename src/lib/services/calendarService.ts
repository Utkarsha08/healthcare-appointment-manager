import { google } from "googleapis";

// Initialize OAuth2 client using env vars
function getCalendarClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost"
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface CalendarEventDetails {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorEmail: string;
  slotStart: Date;
  slotEnd: Date;
  symptoms?: string;
  applicationName?: string;
}

export const calendarService = {
  async createCalendarEvents(details: CalendarEventDetails) {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendar || !calendarId) {
      console.warn("⚠️ Google Calendar API is not configured. Skipping event creation.");
      return { patientEventId: null, doctorEventId: null };
    }

    const {
      patientName,
      patientEmail,
      doctorName,
      doctorEmail,
      slotStart,
      slotEnd,
      symptoms,
      applicationName = "Healthcare Appointment Manager",
    } = details;

    const baseEvent = {
      description: `
**Appointment Details**
Patient: ${patientName}
Doctor: ${doctorName}
${symptoms ? `\n**Symptoms:**\n${symptoms}\n` : ""}
*Scheduled via ${applicationName}*
      `.trim(),
      start: {
        dateTime: slotStart.toISOString(),
      },
      end: {
        dateTime: slotEnd.toISOString(),
      },
    };

    try {
      console.log("📅 Creating calendar events for patient and doctor...");
      
      // Patient Event
      const patientEvent = await calendar.events.insert({
        calendarId,
        requestBody: {
          ...baseEvent,
          summary: `Healthcare Appointment - Dr. ${doctorName}`,
          attendees: [{ email: patientEmail }],
        },
      });

      // Doctor Event
      const doctorEvent = await calendar.events.insert({
        calendarId,
        requestBody: {
          ...baseEvent,
          summary: `Consultation - ${patientName}`,
          attendees: [{ email: doctorEmail }],
        },
      });

      console.log("✅ Google Calendar events created successfully.");

      return {
        patientEventId: patientEvent.data.id || null,
        doctorEventId: doctorEvent.data.id || null,
      };
    } catch (error) {
      console.error("❌ Failed to create Google Calendar events:", error);
      // Calendar failures must NEVER cancel or rollback bookings.
      return { patientEventId: null, doctorEventId: null };
    }
  },

  async deleteCalendarEvents(patientEventId: string | null, doctorEventId: string | null) {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!calendar || !calendarId) {
      return;
    }

    try {
      if (patientEventId) {
        await calendar.events.delete({
          calendarId,
          eventId: patientEventId,
        });
      }
      if (doctorEventId) {
        await calendar.events.delete({
          calendarId,
          eventId: doctorEventId,
        });
      }
      console.log("✅ Google Calendar events deleted successfully.");
    } catch (error) {
      console.error("❌ Failed to delete Google Calendar events:", error);
    }
  },
};
