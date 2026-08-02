'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/features/notifications/services/notifications-service';
import { notificationIdSchema } from '@/features/notifications/validations';

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
