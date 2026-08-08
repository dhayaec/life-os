'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  deleteNotificationAction,
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/features/notifications/actions';
import type { NotificationItem } from '@/features/notifications/services/notifications-service';

import { useMounted } from '@/hooks/use-mounted';

export function NotificationBell() {
  const mounted = useMounted();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getNotificationsAction().then((result) => {
      if (cancelled || !result.ok || !result.data) return;
      setItems(result.data.items);
      setUnread(result.data.unread);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function markAll() {
    if (unread === 0) return;
    const itemsSnapshot = items;
    const unreadSnapshot = unread;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnread(0);
    const result = await markAllNotificationsReadAction();
    if (!result.ok) {
      setItems(itemsSnapshot);
      setUnread(unreadSnapshot);
      toast.error(result.error);
    }
  }

  async function markOne(id: string) {
    const snapshot = items.find((item) => item.id === id);
    if (!snapshot || snapshot.read) return;
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnread((prev) => Math.max(0, prev - 1));
    const result = await markNotificationReadAction({ id });
    if (!result.ok) {
      setItems((prev) => prev.map((item) => (item.id === id ? snapshot : item)));
      setUnread((prev) => prev + 1);
      toast.error(result.error);
    }
  }

  async function remove(id: string) {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const snapshot = items[index];
    if (!snapshot) return;
    const wasUnread = !snapshot.read;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (wasUnread) setUnread((prev) => Math.max(0, prev - 1));
    const result = await deleteNotificationAction({ id });
    if (!result.ok) {
      setItems((prev) => {
        const next = [...prev];
        next.splice(index, 0, snapshot);
        return next;
      });
      if (wasUnread) setUnread((prev) => prev + 1);
      toast.error(result.error);
    }
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
