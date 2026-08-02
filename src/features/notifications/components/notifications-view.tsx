'use client';

import { useRouter } from 'next/navigation';
import { CheckCheck, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/features/notifications/actions';
import type { NotificationItem } from '@/features/notifications/services/notifications-service';

export function NotificationsView({
  items,
  unread,
}: {
  items: NotificationItem[];
  unread: number;
}) {
  const router = useRouter();

  async function markAll() {
    const result = await markAllNotificationsReadAction();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function markOne(item: NotificationItem) {
    if (item.read) return;
    const result = await markNotificationReadAction({ id: item.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function remove(item: NotificationItem) {
    const result = await deleteNotificationAction({ id: item.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Notifications</h1>
          {unread > 0 ? (
            <span className="bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
              {unread} unread
            </span>
          ) : null}
        </div>
        {unread > 0 ? (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-sm">
          <CheckCheck className="size-6" />
          <span>You&apos;re all caught up.</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void markOne(item)}
              className={`flex items-start justify-between gap-3 rounded-md border-b px-3 py-3 text-left last:border-b-0 hover:bg-accent/50 ${
                item.read ? '' : 'bg-accent/20'
              }`}
            >
              <span className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    item.read ? 'bg-transparent' : 'bg-primary'
                  }`}
                />
                <span className="sr-only">{item.read ? 'Read' : 'Unread'}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.body ? (
                    <span className="text-muted-foreground text-xs">{item.body}</span>
                  ) : null}
                  <span suppressHydrationWarning className="text-muted-foreground text-[10px]">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </span>
              </span>
              <span className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete notification ${item.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void remove(item);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
