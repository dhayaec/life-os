import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { NotificationsView } from '@/features/notifications/components/notifications-view';
import {
  getNotifications,
  getUnreadCount,
} from '@/features/notifications/services/notifications-service';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser();
  const [items, unread] = await Promise.all([getNotifications(user.id), getUnreadCount(user.id)]);

  return <NotificationsView items={items} unread={unread} />;
}
