import { Prisma } from "@prisma/client";

export const notificationService = {
  // Notice we can pass a transaction client `tx` so this participates in larger transactions
  async createCancellationNotifications(
    tx: Prisma.TransactionClient,
    appointmentIds: string[],
    patientEmails: string[]
  ) {
    const notifications = appointmentIds.map((id, index) => ({
      appointmentId: id,
      type: "cancellation",
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
