import nodemailer from "nodemailer";

export const emailService = {
  getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  },

  getFromAddress() {
    return process.env.SMTP_FROM || '"Healthcare Manager" <noreply@healthcare.example.com>';
  },

  _getBaseTemplate(title: string, bodyHtml: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background-color: #2563eb; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Healthcare Appointment Manager</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-top: 0; margin-bottom: 20px;">${title}</h2>
            <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              ${bodyHtml}
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f3f4f6; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Thank you for using Healthcare Appointment Manager.</p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">This is an automated message, please do not reply directly to this email.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  },

  async sendAppointmentConfirmation(recipientEmail: string, patientName: string, doctorName: string, doctorSpecialization: string, dateStr: string, symptoms: string | undefined, isForDoctor: boolean) {
    const greeting = isForDoctor ? `Dr. ${doctorName}` : patientName;
    const body = `
      <p>Dear ${greeting},</p>
      <p>An appointment has been successfully booked.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
        <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Doctor:</strong> Dr. ${doctorName} <span style="color: #6b7280;">(${doctorSpecialization})</span></p>
        ${symptoms ? `<p style="margin: 0;"><strong>Symptoms:</strong> ${symptoms}</p>` : ''}
      </div>
      
      <p>Google Calendar synchronization is active for connected users.</p>
      <p>${isForDoctor ? 'Please review the patient details prior to consultation.' : 'Please arrive 10 minutes early. You can manage this appointment from your dashboard.'}</p>
    `;

    await this.sendMail(recipientEmail, "Appointment Confirmed", this._getBaseTemplate("Appointment Confirmed", body));
  },

  async sendAppointmentRescheduled(recipientEmail: string, patientName: string, doctorName: string, oldDateStr: string, newDateStr: string, isForDoctor: boolean) {
    const greeting = isForDoctor ? `Dr. ${doctorName}` : patientName;
    const body = `
      <p>Dear ${greeting},</p>
      <p>An upcoming appointment has been <strong>rescheduled</strong>.</p>
      
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; text-decoration: line-through; color: #6b7280;"><strong>Previous Time:</strong> ${oldDateStr}</p>
        <p style="margin: 0 0 8px 0; color: #1d4ed8;"><strong>New Date & Time:</strong> ${newDateStr}</p>
        <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
      </div>
      
      <p>Your Google Calendar has been automatically updated (if connected).</p>
    `;

    await this.sendMail(recipientEmail, "Appointment Rescheduled", this._getBaseTemplate("Appointment Rescheduled", body));
  },

  async sendAppointmentReminder(recipientEmail: string, patientName: string, doctorName: string, dateStr: string, isForDoctor: boolean) {
    const greeting = isForDoctor ? `Dr. ${doctorName}` : patientName;
    const body = `
      <p>Dear ${greeting},</p>
      <p>This is a friendly reminder for your upcoming appointment.</p>
      
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
        <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
      </div>
      
      <p>${isForDoctor ? 'Please ensure you are ready for the consultation.' : 'Please arrive on time.'}</p>
    `;

    await this.sendMail(recipientEmail, "Appointment Reminder", this._getBaseTemplate("Appointment Reminder", body));
  },

  async sendAppointmentCancellation(recipientEmail: string, patientName: string, doctorName: string, dateStr: string, isForDoctor: boolean) {
    const greeting = isForDoctor ? `Dr. ${doctorName}` : patientName;
    const body = `
      <p>Dear ${greeting},</p>
      <p>The following appointment has been <strong>cancelled</strong>.</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${dateStr}</p>
        <p style="margin: 0 0 8px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
      </div>
      
      <p>Any associated Google Calendar events have been automatically removed.</p>
    `;

    await this.sendMail(recipientEmail, "Appointment Cancelled", this._getBaseTemplate("Appointment Cancelled", body));
  },

  async sendPasswordChangeEmail(userEmail: string, userName: string) {
    const body = `
      <p>Dear ${userName},</p>
      <p>Your password was recently changed successfully.</p>
      <p>If you did not make this change, please contact support immediately.</p>
    `;

    await this.sendMail(userEmail, "Your Password Was Changed", this._getBaseTemplate("Password Changed", body));
  },

  async sendMail(to: string, subject: string, html: string) {
    // Fail silently if SMTP isn't fully configured to avoid crashing when users test locally
    if (!process.env.SMTP_HOST) {
      console.warn("SMTP_HOST is not defined. Email dispatch skipped for:", to);
      return;
    }

    const transporter = this.getTransporter();
    await transporter.sendMail({
      from: this.getFromAddress(),
      to,
      subject,
      html,
    });
  }
};
