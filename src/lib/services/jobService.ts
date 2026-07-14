import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const jobService = {
  async queueEmail(
    type: string, 
    payload: Record<string, unknown>, 
    tx?: Prisma.TransactionClient
  ) {
    const data = {
      type: "EMAIL_RETRY",
      payload: { emailType: type, ...payload } as Prisma.InputJsonValue,
      status: "PENDING" as const,
    };
    
    const db = tx || prisma;
    return await db.backgroundJob.create({
      data,
    });
  },

  async markJobCompleted(id: string) {
    return await prisma.backgroundJob.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
  },

  async markJobFailed(id: string, errorMsg: string) {
    const job = await prisma.backgroundJob.findUnique({ where: { id } });
    if (!job) return;

    const attempts = job.attempts + 1;
    const status = attempts >= job.maxAttempts ? "FAILED" : "PENDING";

    return await prisma.backgroundJob.update({
      where: { id },
      data: {
        attempts,
        status,
        lastError: errorMsg,
      },
    });
  },

  async getPendingJobs() {
    return await prisma.backgroundJob.findMany({
      where: {
        status: "PENDING",
        executeAt: { lte: new Date() },
        attempts: { lt: 3 },
      },
      orderBy: { createdAt: "asc" },
      take: 20, // Process in batches
    });
  }
};
