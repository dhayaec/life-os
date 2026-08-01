import 'server-only';

import { sendEmail } from '@/lib/email';
import { db } from '@/server/db';
import { env } from '@/server/env';
import type { Notification as NotificationRecord } from '@/generated/prisma/client';

export type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  createdAt: string;
};

const NOTIFICATION_SUBJECTS: Record<string, string> = {
  general: 'LifeOS notification',
  task: 'LifeOS task update',
  reminder: 'LifeOS reminder',
  mention: 'You were mentioned in LifeOS',
};

function subjectFor(type: string): string {
  return NOTIFICATION_SUBJECTS[type] ?? 'LifeOS notification';
}

function serialize(notification: NotificationRecord): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

async function sendNotificationEmail(
  userId: string,
  type: string,
  title: string,
  body: string | null
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, settings: { select: { emailNotifications: true } } },
  });
  if (!user || user.settings?.emailNotifications === false) return;

  await sendEmail({
    to: user.email,
    name: user.name,
    subject: subjectFor(type),
    url: new URL('/notifications', env.BETTER_AUTH_URL).toString(),
    actionLabel: 'View in LifeOS',
    body: body ? `${title}\n${body}` : title,
  });
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
  input: { title: string; body?: string | null; type?: string }
): Promise<NotificationItem> {
  const type = input.type ?? 'general';
  const row = await db.notification.create({
    data: {
      userId,
      title: input.title,
      body: input.body ?? null,
      type,
    },
  });

  // Email is best-effort and preference-gated; failures must never surface to
  // the caller or slow down the in-app notification.
  void sendNotificationEmail(userId, type, input.title, input.body ?? null).catch(() => {});

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
