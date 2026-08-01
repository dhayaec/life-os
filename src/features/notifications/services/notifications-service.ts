import 'server-only';

import { db } from '@/server/db';
import type { Notification as NotificationRecord } from '@/generated/prisma/client';

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

function serialize(notification: NotificationRecord): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function getNotifications(userId: string, limit = 50): Promise<NotificationItem[]> {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(serialize);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}

export async function createNotification(
  userId: string,
  input: { title: string; body?: string | null }
): Promise<NotificationItem> {
  const row = await db.notification.create({
    data: {
      userId,
      title: input.title,
      body: input.body ?? null,
    },
  });
  return serialize(row);
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await db.notification.update({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  await db.notification.delete({ where: { id, userId } });
}
