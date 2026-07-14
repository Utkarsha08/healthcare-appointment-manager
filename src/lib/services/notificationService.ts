import { Prisma } from "@prisma/client";

export const notificationService = {
  async createConfirmationNotification(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    patientEmail: string,
    doctorEmail: string,
    doctorName?: string,
    patientName?: string,
    dateStr?: string,
  ) {
    const notifications = [
      {
        appointmentId,
        type: `New appointment booked for ${dateStr || 'upcoming date'}`,
        recipient: doctorEmail,
        status: "PENDING" as const,
      },
      {
        appointmentId,
        type: `Appointment confirmed with Dr. ${doctorName || 'your doctor'}`,
        recipient: patientEmail,
        status: "PENDING" as const,
      },
    ];

    await tx.notification.createMany({
      data: notifications,
    });
  },

  async createConsultationCompletedNotification(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    patientEmail: string
  ) {
    await tx.notification.create({
      data: {
        appointmentId,
        type: "Consultation completed",
        recipient: patientEmail,
        status: "PENDING" as const,
      },
    });
  },

  async createLeaveCancellationNotifications(
    tx: Prisma.TransactionClient,
    appointmentIds: string[],
    patientEmails: string[]
  ) {
    const notifications = appointmentIds.map((id, index) => ({
      appointmentId: id,
      type: "Leave scheduled: Your appointment has been cancelled",
      recipient: patientEmails[index],
      status: "PENDING" as const,
    }));

    if (notifications.length > 0) {
      await tx.notification.createMany({
        data: notifications,
      });
    }
  },

  async createPatientCancellationNotification(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    doctorEmail: string,
    patientName: string,
    dateStr: string
  ) {
    await tx.notification.create({
      data: {
        appointmentId,
        type: `${patientName} cancelled the appointment scheduled for ${dateStr}.`,
        recipient: doctorEmail,
        status: "PENDING" as const,
      },
    });
  },
};

