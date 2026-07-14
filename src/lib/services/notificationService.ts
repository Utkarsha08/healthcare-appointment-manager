import { Prisma } from "@prisma/client";

export const notificationService = {
  async createConfirmationNotification(
    tx: Prisma.TransactionClient,
    appointmentId: string,
    patientEmail: string,
    doctorEmail: string
  ) {
    const notifications = [
      {
        appointmentId,
        type: "booking_confirmation",
        recipient: patientEmail,
        status: "PENDING" as const,
      },
      {
        appointmentId,
        type: "booking_confirmation",
        recipient: doctorEmail,
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
        type: "consultation_completed",
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
      type: "leave_cancellation",
      recipient: patientEmails[index],
      status: "PENDING" as const,
    }));

    if (notifications.length > 0) {
      await tx.notification.createMany({
        data: notifications,
      });
    }
  },
};
