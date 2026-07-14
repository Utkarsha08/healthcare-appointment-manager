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

  async sendAppointmentConfirmation(patientEmail: string, patientName: string, doctorName: string, dateStr: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Appointment Confirmed</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment with <strong>Dr. ${doctorName}</strong> has been successfully booked.</p>
        <p><strong>Date & Time:</strong> ${dateStr}</p>
        <p>Please arrive 10 minutes early. If you need to cancel, you can do so from your dashboard.</p>
        <br/>
        <p>Best regards,<br/>Healthcare Manager Team</p>
      </div>
    `;

    await this.sendMail(patientEmail, "Appointment Confirmed", html);
  },

  async sendAppointmentCancellation(recipientEmail: string, patientName: string, doctorName: string, dateStr: string, isForDoctor: boolean) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #dc2626;">Appointment Cancelled</h2>
        <p>Dear ${isForDoctor ? `Dr. ${doctorName}` : patientName},</p>
        <p>The appointment scheduled on <strong>${dateStr}</strong> has been cancelled.</p>
        ${isForDoctor ? `<p>Patient: ${patientName}</p>` : `<p>Doctor: Dr. ${doctorName}</p>`}
        <br/>
        <p>Best regards,<br/>Healthcare Manager Team</p>
      </div>
    `;

    await this.sendMail(recipientEmail, "Appointment Cancelled", html);
  },

  async sendPasswordChangeEmail(userEmail: string, userName: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2563eb;">Password Changed</h2>
        <p>Dear ${userName},</p>
        <p>Your password was recently changed successfully. If you did not make this change, please contact support immediately.</p>
        <br/>
        <p>Best regards,<br/>Healthcare Manager Team</p>
      </div>
    `;

    await this.sendMail(userEmail, "Your Password Was Changed", html);
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
