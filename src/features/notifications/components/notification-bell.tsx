'use client';

import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { NotificationItem } from '@/features/notifications/services/notifications-service';

import { useLocalQuery } from '@/hooks/use-local-query';
import { useMounted } from '@/hooks/use-mounted';
import { useSyncMutation } from '@/hooks/use-sync-mutation';

export function NotificationBell() {
  const mounted = useMounted();
  const router = useRouter();
  const { rows } = useLocalQuery<NotificationItem>('notifications', (all) =>
    [...all].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );
  const { enqueue } = useSyncMutation('notifications');
  const items = rows ?? [];
  const unread = items.filter((item) => !item.read).length;

  function markAll() {
    if (unread === 0) return;
    const now = new Date().toISOString();
    for (const item of items) {
      if (!item.read) {
        void enqueue('update', { id: item.id, read: true, updatedAt: now });
      }
    }
  }

  function markOne(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target || target.read) return;
    void enqueue('update', { id, read: true, updatedAt: new Date().toISOString() });
  }

  function remove(id: string) {
    void enqueue('delete', { id, deletedAt: new Date().toISOString() });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 ? (
              <Button variant="ghost" size="sm" onClick={markAll} className="h-7 text-xs">
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-6 text-center text-sm">
            You&apos;re all caught up.
          </div>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.id}
              onClick={() => void markOne(item.id)}
              className="flex items-start gap-2 py-2"
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  item.read ? 'bg-transparent' : 'bg-primary'
                }`}
              />
              <span className="sr-only">{item.read ? 'Read' : 'Unread'}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{item.title}</span>
                {item.body ? (
                  <span className="text-muted-foreground line-clamp-2 text-xs">{item.body}</span>
                ) : null}
                <span className="text-muted-foreground text-[10px]">
                  {mounted ? timeAgo(item.createdAt) : ''}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                aria-label={`Delete notification ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  void remove(item.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/notifications')} className="justify-center">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
