'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/features/notifications/services/notifications-service';
import { notificationIdSchema } from '@/features/notifications/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function getNotificationsAction(): Promise<
  ActionResult<{ items: NotificationItem[]; unread: number }>
> {
  const user = await requireUser();
  return handle(async () => {
    const [items, unread] = await Promise.all([getNotifications(user.id), getUnreadCount(user.id)]);
    return { items, unread };
  });
}

export async function markNotificationReadAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = notificationIdSchema.parse(input);
  return handle(async () => {
    await markNotificationRead(user.id, data.id);
    revalidatePath('/notifications');
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const user = await requireUser();
  return handle(async () => {
    await markAllNotificationsRead(user.id);
    revalidatePath('/notifications');
  });
}

export async function deleteNotificationAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = notificationIdSchema.parse(input);
  return handle(async () => {
    await deleteNotification(user.id, data.id);
    revalidatePath('/notifications');
  });
}
