'use client';

import { useEffect } from 'react';
import { CheckCheck, Trash2 } from 'lucide-react';

import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationItem } from '@/features/notifications/services/notifications-service';

import { useMounted } from '@/hooks/use-mounted';
import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

export function NotificationsView({ items: initialItems }: { items: NotificationItem[] }) {
  useRouteLoadedSignal();
  const mounted = useMounted();
  const { rows, hydrated } = useLocalQuery<NotificationItem>('notifications', (all) =>
    [...all].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );
  const { enqueue } = useSyncMutation('notifications');
  const items = rows ?? [];
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    void syncEngine.hydrateSeed('notifications', initialItems);
  }, [initialItems]);

  function markAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    for (const item of items) {
      if (!item.read) {
        void enqueue('update', { id: item.id, read: true, updatedAt: now });
      }
    }
  }

  function markOne(item: NotificationItem) {
    if (item.read) return;
    void enqueue('update', { id: item.id, read: true, updatedAt: new Date().toISOString() });
  }

  function remove(item: NotificationItem) {
    if (!items.some((n) => n.id === item.id)) return;
    void enqueue('delete', { id: item.id, deletedAt: new Date().toISOString() });
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Notifications" />
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notifications"
        {...(unread > 0 ? { description: `${unread} unread` } : {})}
      >
        {unread > 0 ? (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        ) : null}
      </PageHeader>

      {items.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-md border border-dashed py-16 text-sm">
          <CheckCheck className="size-6" />
          <span>You&apos;re all caught up.</span>
        </div>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => void markOne(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void markOne(item);
                }
              }}
              className={`flex cursor-pointer items-start justify-between gap-3 rounded-md border-b px-3 py-3 text-left last:border-b-0 hover:bg-accent/50 ${
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
                  <span className="text-muted-foreground text-[10px]">
                    {mounted ? new Date(item.createdAt).toLocaleString() : ''}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
