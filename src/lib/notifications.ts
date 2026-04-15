import { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendNotification(
  recipientId: string,
  type: NotificationType,
  payload: NotificationPayload
): Promise<void> {
  await prisma.notification.create({
    data: {
      recipientId,
      type,
      title: payload.title,
      body: payload.body,
      payload: (payload.data ?? {}) as object,
    },
  });

  // Emit pg NOTIFY for SSE push
  try {
    await prisma.$executeRawUnsafe(
      `NOTIFY member_notifications, '${JSON.stringify({ recipientId }).replace(/'/g, "''")}'`
    );
  } catch {
    // Non-critical: SSE client will poll as fallback
  }
}

export async function broadcastToUnit(
  unitId: string,
  type: NotificationType,
  payload: NotificationPayload,
  excludeMemberId?: string
): Promise<void> {
  const members = await prisma.member.findMany({
    where: {
      unitId,
      isActive: true,
      ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}),
    },
    select: { id: true },
  });

  if (members.length === 0) return;

  await prisma.notification.createMany({
    data: members.map((m) => ({
      recipientId: m.id,
      type,
      title: payload.title,
      body: payload.body,
      payload: (payload.data ?? {}) as object,
    })),
  });

  // Single broadcast notify
  try {
    await prisma.$executeRawUnsafe(
      `NOTIFY unit_notifications, '${JSON.stringify({ unitId }).replace(/'/g, "''")}'`
    );
  } catch {
    // Non-critical
  }
}
