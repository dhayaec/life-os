'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { EventDialog, type EventInitial } from '@/features/calendar/components/event-dialog';
import type { CalendarEventItem } from '@/features/calendar/services/calendar-service';

import { useMounted } from '@/hooks/use-mounted';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarView({ month, events }: { month: string; events: CalendarEventItem[] }) {
  useRouteLoadedSignal();
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<
    { mode: 'create'; date: string } | { mode: 'edit'; event: CalendarEventItem } | null
  >(null);

  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthIndex = parts[1] ?? new Date().getMonth() + 1;
  const month0 = monthIndex - 1;
  const firstDay = new Date(year, month0, 1);
  const today = new Date();

  function goToMonth(offset: number) {
    const target = new Date(year, month0 + offset, 1);
    const params = new URLSearchParams(searchParams);
    params.set(
      'month',
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToToday() {
    goToMonth(0);
  }

  const eventsByDate = new Map<string, CalendarEventItem[]>();
  for (const event of events) {
    const key = toDateKey(new Date(event.startAt));
    const list = eventsByDate.get(key) ?? [];
    list.push(event);
    eventsByDate.set(key, list);
  }

  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  type Cell = { key: string; day: number | null };
  const cells: Cell[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ key: `pad-${i}`, day: null });
  for (let day = 1; day <= daysInMonth; day++)
    cells.push({ key: `${year}-${month0 + 1}-${day}`, day });
  const remainder = cells.length % 7;
  for (let i = 0; i < (remainder === 0 ? 0 : 7 - remainder); i++) {
    cells.push({ key: `pad-end-${i}`, day: null });
  }

  const dialogInitial: EventInitial | null = dialog
    ? dialog.mode === 'edit'
      ? {
          id: dialog.event.id,
          title: dialog.event.title,
          description: dialog.event.description,
          startAt: dialog.event.startAt,
          endAt: dialog.event.endAt,
          allDay: dialog.event.allDay,
          location: dialog.event.location,
          color: dialog.event.color,
        }
      : {
          id: null,
          title: '',
          description: null,
          startAt: `${dialog.date}T00:00:00`,
          endAt: null,
          allDay: false,
          location: null,
          color: '#6366f1',
        }
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => goToMonth(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => goToMonth(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <h1 className="text-lg font-semibold">
          {mounted
            ? firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
            : ''}
        </h1>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-muted-foreground py-1 text-center text-xs font-medium">
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          if (cell.day === null) {
            return <div key={cell.key} className="min-h-24 rounded-md" />;
          }
          const date = new Date(year, month0, cell.day);
          const key = toDateKey(date);
          const dayEvents = eventsByDate.get(key) ?? [];
          const isToday = mounted && key === toDateKey(today);
          return (
            <div
              key={key}
              className={`group flex min-h-24 flex-col gap-1 rounded-md border p-1 ${
                isToday ? 'border-primary' : 'border-transparent hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-1 text-xs ${isToday ? 'font-semibold' : 'text-muted-foreground'}`}
                >
                  {cell.day}
                </span>
                <button
                  type="button"
                  aria-label={`Add event on ${key}`}
                  onClick={() => setDialog({ mode: 'create', date: key })}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded p-0.5 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              {dayEvents.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setDialog({ mode: 'edit', event })}
                  className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px]"
                  style={{ backgroundColor: `${event.color}22`, color: event.color }}
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  {event.allDay ? null : mounted ? `${toTime(event.startAt)} ` : ' '}
                  <span className="truncate">{event.title}</span>
                </button>
              ))}
              {dayEvents.length > 3 ? (
                <span className="text-muted-foreground px-1 text-[10px]">
                  +{dayEvents.length - 3} more
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <EventDialog
        key={dialog?.mode === 'edit' ? dialog.event.id : dialog ? `new-${dialog.date}` : 'none'}
        initial={dialogInitial}
        open={dialog !== null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function toTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
