import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

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

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const calendarService = {
  // ==========================================
  // DOCTOR CALENDAR LOGIC (UNTOUCHED)
  // ==========================================
  getAuthUrl(doctorId: string) {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events"
      ],
      state: `doctor:${doctorId}`,
      prompt: "consent",
    });
  },

  async handleCallback(code: string, doctorId: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarId: "primary",
        googleEmail: userInfo.data.email,
      },
    });
  },

  async disconnect(doctorId: string) {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
        googleEmail: null,
      },
    });
  },

  async getCalendarClientForDoctor(doctorId: string) {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { googleRefreshToken: true, googleAccessToken: true, googleTokenExpiry: true }
    });

    if (!doctor || !doctor.googleRefreshToken) {
      return null;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: doctor.googleRefreshToken,
      access_token: doctor.googleAccessToken || undefined,
      expiry_date: doctor.googleTokenExpiry ? doctor.googleTokenExpiry.getTime() : undefined,
    });

    oauth2Client.on('tokens', async (tokens) => {
      try {
        await prisma.doctor.update({
          where: { id: doctorId },
          data: {
            ...(tokens.access_token ? { googleAccessToken: tokens.access_token } : {}),
            ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
            ...(tokens.expiry_date ? { googleTokenExpiry: new Date(tokens.expiry_date) } : {}),
          },
        });
      } catch (err) {
        console.error("Failed to update Google tokens in DB:", err);
      }
    });

    try {
      const { token } = await oauth2Client.getAccessToken();
      if (token) {
        const tokenInfo = await oauth2Client.getTokenInfo(token);
        const scopes = tokenInfo.scopes || [];
        if (!scopes.includes("https://www.googleapis.com/auth/calendar.events")) {
          console.warn(`[Google Calendar] Insufficient scopes detected for doctor ${doctorId}. Disconnecting.`);
          await this.disconnect(doctorId);
          throw new Error("Insufficient Google Calendar permissions. Please reconnect.");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Insufficient Google Calendar permissions")) {
        throw err;
      }
      this._handleGoogleError(err, doctorId);
      return null; // Return null to prevent event creation attempt without valid scopes
    }

    return google.calendar({ version: "v3", auth: oauth2Client });
  },

  _formatEvent(details: CalendarEventDetails) {
    const {
      patientName,
      doctorName,
      slotStart,
      slotEnd,
      symptoms,
      applicationName = "Healthcare Appointment Manager",
    } = details;

    return {
      summary: `Consultation - ${patientName}`,
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
  },

  async createCalendarEvent(doctorId: string, details: CalendarEventDetails) {
    const calendar = await this.getCalendarClientForDoctor(doctorId);
    if (!calendar) return null;

    try {
      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          ...this._formatEvent(details),
          attendees: [{ email: details.patientEmail }],
        },
      });
      return event.data.id || null;
    } catch (error: unknown) {
      this._handleGoogleError(error, doctorId);
      throw error;
    }
  },

  async updateCalendarEvent(doctorId: string, eventId: string, details: CalendarEventDetails) {
    const calendar = await this.getCalendarClientForDoctor(doctorId);
    if (!calendar) return;

    try {
      await calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: {
          ...this._formatEvent(details),
          attendees: [{ email: details.patientEmail }],
        },
      });
    } catch (error: unknown) {
      this._handleGoogleError(error, doctorId);
      throw error;
    }
  },

  async deleteCalendarEvent(doctorId: string, eventId: string) {
    const calendar = await this.getCalendarClientForDoctor(doctorId);
    if (!calendar) return;

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
    } catch (error: unknown) {
      // Swallowing the error to ensure cancellation jobs never get permanently stuck
      this._handleGoogleError(error, doctorId);
    }
  },

  _handleGoogleError(error: unknown, doctorId: string) {
    if (typeof error !== "object" || error === null) {
      console.error(`[Google Calendar] Unexpected error for doctor ${doctorId}:`, error);
      return;
    }

    const err = error as Record<string, unknown>;
    const code = typeof err.code === 'number' ? err.code : typeof err.status === 'number' ? err.status : undefined;
    const message = typeof err.message === 'string' ? err.message : "";

    // Log complete Google API response
    console.error(`[Google Calendar] Full API Error for doctor ${doctorId}:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    const isQuota = code === 429 || message.includes("quotaExceeded") || message.includes("rateLimitExceeded");
    const isTransient = isQuota || (code && code >= 500);

    const isInsufficientScopes = message.includes("insufficient authentication scopes") || message.includes("insufficientPermissions");
    const isInvalidGrant = message.includes("invalid_grant");
    const isRevoked = message.includes("Token has been expired or revoked");
    const isPermissionDenied = code === 403 && !isQuota;
    const isExpiredToken = message.includes("expired") && !isRevoked;

    if (code === 401 || isInsufficientScopes || isInvalidGrant || isRevoked || isPermissionDenied) {
      const reason = isInsufficientScopes ? 'Insufficient Scopes' : isInvalidGrant ? 'Invalid Grant' : isRevoked ? 'Revoked' : isExpiredToken ? 'Expired' : 'Permission Denied';
      console.warn(`[Google Calendar] Permanent auth/permission error for doctor ${doctorId} (code: ${code}, reason: ${reason}). Disconnecting calendar.`);
      this.disconnect(doctorId).catch(() => { });
      return;
    }

    if (isTransient) {
      console.warn(`[Google Calendar] Transient/Quota error (${code}) for doctor ${doctorId}. Will retry later.`);
    } else {
      console.error(`[Google Calendar] Unexpected error for doctor ${doctorId}:`, message);
    }
  },

  // ==========================================
  // PATIENT CALENDAR LOGIC
  // ==========================================
  getAuthUrlPatient(patientId: string) {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar.events"
      ],
      state: `patient:${patientId}`,
      prompt: "consent",
    });
  },

  async handleCallbackPatient(code: string, patientId: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    await prisma.user.update({
      where: { id: patientId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        googleCalendarId: "primary",
        googleEmail: userInfo.data.email,
      },
    });
  },

  async disconnectPatient(patientId: string) {
    await prisma.user.update({
      where: { id: patientId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
        googleEmail: null,
      },
    });
  },

  async getCalendarClientForPatient(patientId: string) {
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { googleRefreshToken: true, googleAccessToken: true, googleTokenExpiry: true }
    });

    if (!patient || !patient.googleRefreshToken) {
      return null;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: patient.googleRefreshToken,
      access_token: patient.googleAccessToken || undefined,
      expiry_date: patient.googleTokenExpiry ? patient.googleTokenExpiry.getTime() : undefined,
    });

    oauth2Client.on('tokens', async (tokens) => {
      try {
        await prisma.user.update({
          where: { id: patientId },
          data: {
            ...(tokens.access_token ? { googleAccessToken: tokens.access_token } : {}),
            ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
            ...(tokens.expiry_date ? { googleTokenExpiry: new Date(tokens.expiry_date) } : {}),
          },
        });
      } catch (err) {
        console.error("Failed to update Google tokens in DB for patient:", err);
      }
    });

    try {
      const { token } = await oauth2Client.getAccessToken();
      if (token) {
        const tokenInfo = await oauth2Client.getTokenInfo(token);
        const scopes = tokenInfo.scopes || [];
        if (!scopes.includes("https://www.googleapis.com/auth/calendar.events")) {
          console.warn(`[Google Calendar] Insufficient scopes detected for patient ${patientId}. Disconnecting.`);
          await this.disconnectPatient(patientId);
          throw new Error("Insufficient Google Calendar permissions. Please reconnect.");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Insufficient Google Calendar permissions")) {
        throw err;
      }
      this._handleGoogleErrorPatient(err, patientId);
      return null;
    }

    return google.calendar({ version: "v3", auth: oauth2Client });
  },

  _formatEventPatient(details: CalendarEventDetails) {
    const {
      patientName,
      doctorName,
      slotStart,
      slotEnd,
      symptoms,
      applicationName = "Healthcare Appointment Manager",
    } = details;

    return {
      summary: `Appointment with Dr. ${doctorName}`,
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
  },

  async createPatientCalendarEvent(patientId: string, details: CalendarEventDetails) {
    const calendar = await this.getCalendarClientForPatient(patientId);
    if (!calendar) return null;

    try {
      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          ...this._formatEventPatient(details),
          attendees: [{ email: details.doctorEmail }],
        },
      });
      return event.data.id || null;
    } catch (error: unknown) {
      this._handleGoogleErrorPatient(error, patientId);
      throw error;
    }
  },

  async updatePatientCalendarEvent(patientId: string, eventId: string, details: CalendarEventDetails) {
    const calendar = await this.getCalendarClientForPatient(patientId);
    if (!calendar) return;

    try {
      await calendar.events.update({
        calendarId: "primary",
        eventId,
        requestBody: {
          ...this._formatEventPatient(details),
          attendees: [{ email: details.doctorEmail }],
        },
      });
    } catch (error: unknown) {
      this._handleGoogleErrorPatient(error, patientId);
      throw error;
    }
  },

  async deletePatientCalendarEvent(patientId: string, eventId: string) {
    const calendar = await this.getCalendarClientForPatient(patientId);
    if (!calendar) return;

    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
    } catch (error: unknown) {
      // Swallowing the error to ensure cancellation jobs never get permanently stuck
      this._handleGoogleErrorPatient(error, patientId);
    }
  },

  _handleGoogleErrorPatient(error: unknown, patientId: string) {
    if (typeof error !== "object" || error === null) {
      console.error(`[Google Calendar] Unexpected error for patient ${patientId}:`, error);
      return;
    }

    const err = error as Record<string, unknown>;
    const code = typeof err.code === 'number' ? err.code : typeof err.status === 'number' ? err.status : undefined;
    const message = typeof err.message === 'string' ? err.message : "";

    // Log complete Google API response
    console.error(`[Google Calendar] Full API Error for patient ${patientId}:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

    const isQuota = code === 429 || message.includes("quotaExceeded") || message.includes("rateLimitExceeded");
    const isTransient = isQuota || (code && code >= 500);

    const isInsufficientScopes = message.includes("insufficient authentication scopes") || message.includes("insufficientPermissions");
    const isInvalidGrant = message.includes("invalid_grant");
    const isRevoked = message.includes("Token has been expired or revoked");
    const isPermissionDenied = code === 403 && !isQuota;
    const isExpiredToken = message.includes("expired") && !isRevoked;

    if (code === 401 || isInsufficientScopes || isInvalidGrant || isRevoked || isPermissionDenied) {
      const reason = isInsufficientScopes ? 'Insufficient Scopes' : isInvalidGrant ? 'Invalid Grant' : isRevoked ? 'Revoked' : isExpiredToken ? 'Expired' : 'Permission Denied';
      console.warn(`[Google Calendar] Permanent auth/permission error for patient ${patientId} (code: ${code}, reason: ${reason}). Disconnecting calendar.`);
      this.disconnectPatient(patientId).catch(() => { });
      return;
    }

    if (isTransient) {
      console.warn(`[Google Calendar] Transient/Quota error (${code}) for patient ${patientId}. Will retry later.`);
    } else {
      console.error(`[Google Calendar] Unexpected error for patient ${patientId}:`, message);
    }
  }
};
