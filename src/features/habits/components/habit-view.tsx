'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HabitFormDialog, type HabitInitial } from '@/features/habits/components/habit-form-dialog';
import type { HabitEntryItem, HabitItem } from '@/features/habits/services/habit-service';

import { useMounted } from '@/hooks/use-mounted';
import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

export function HabitView({
  month,
  habits: initialHabits,
}: {
  month: string;
  habits: HabitItem[];
}) {
  useRouteLoadedSignal();
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<string | null>(null);
  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; habit: HabitItem } | null
  >(null);

  const { rows, hydrated } = useLocalQuery<HabitItem>('habits', (all) =>
    [...all].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  );
  const { enqueue } = useSyncMutation('habits');
  const habits = rows ?? [];

  useEffect(() => {
    void syncEngine.hydrateSeed('habits', initialHabits);
  }, [initialHabits]);

  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthIndex = parts[1] ?? new Date().getMonth() + 1;
  const month0 = monthIndex - 1;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const today = new Date();
  const todayKey = toKey(today);
  const title = mounted
    ? new Date(year, month0, 1).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '';

  function goToMonth(offset: number) {
    const target = new Date(year, month0 + offset, 1);
    const params = new URLSearchParams(searchParams);
    params.set(
      'month',
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggle(habitId: string, date: string, done: boolean) {
    const lock = `${habitId}:${date}`;
    if (pending === lock) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const next = !done;
    setPending(lock);
    void enqueue('update', {
      id: habitId,
      entries: applyEntry(habit.entries, date, next),
      updatedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  const days: { key: string; day: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      key: `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
    });
  }

  const dialogInitial: HabitInitial | null = dialog
    ? dialog.mode === 'edit'
      ? { id: dialog.habit.id, name: dialog.habit.name, frequency: dialog.habit.frequency }
      : { id: null, name: '', frequency: 'daily' }
    : null;

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-3">
        <PageHeader title={title} />
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title={title}>
        <Button variant="outline" size="sm" onClick={() => goToMonth(0)}>
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
        <Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
          <Plus className="size-4" />
          New habit
        </Button>
      </PageHeader>

      {habits.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-md border border-dashed p-12 text-sm">
          <p>No habits yet.</p>
          <Button variant="outline" size="sm" onClick={() => setDialog({ mode: 'create' })}>
            Add your first habit
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-muted/50 sticky left-0 z-10 w-52 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                  Habit
                </th>
                {days.map((day) => (
                  <th
                    key={day.key}
                    className={`px-0.5 py-2 text-center text-xs font-medium ${
                      mounted && day.key === todayKey ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {day.day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => {
                const doneByDate = new Map<string, boolean>();
                for (const entry of habit.entries) doneByDate.set(entry.date, entry.done);
                const summary =
                  habit.frequency === 'daily'
                    ? `${streakCount(doneByDate)}-day streak`
                    : `${checkInCount(doneByDate, month)} check-ins`;
                return (
                  <tr key={habit.id}>
                    <td className="bg-background sticky left-0 z-10 w-52 border-t px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDialog({ mode: 'edit', habit })}
                          className="text-sm font-medium hover:underline"
                        >
                          {habit.name}
                        </button>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {habit.frequency}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {mounted ? summary : ''}
                      </div>
                    </td>
                    {days.map((day) => {
                      const done = doneByDate.get(day.key) ?? false;
                      const isFuture = mounted && day.key > todayKey;
                      return (
                        <td key={day.key} className="border-t px-0.5 py-2 text-center">
                          <button
                            type="button"
                            disabled={isFuture || pending === `${habit.id}:${day.key}`}
                            aria-label={`Mark ${habit.name} ${done ? 'not done' : 'done'} on ${day.key}`}
                            aria-pressed={done}
                            onClick={() => toggle(habit.id, day.key, done)}
                            className="rounded p-0.5 disabled:cursor-default disabled:opacity-20"
                          >
                            <span
                              className={`block size-4 rounded-full border-2 ${
                                done
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground/40 hover:border-primary/70'
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <HabitFormDialog
        key={dialog?.mode === 'edit' ? dialog.habit.id : dialog ? 'new' : 'none'}
        initial={dialogInitial}
        open={dialog !== null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function applyEntry(entries: HabitEntryItem[], date: string, done: boolean): HabitEntryItem[] {
  if (!entries.some((e) => e.date === date)) {
    return [...entries, { date, done, updatedAt: new Date().toISOString() }];
  }
  return entries.map((e) => (e.date === date ? { ...e, done } : e));
}

function toKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function streakCount(doneByDate: Map<string, boolean>) {
  const cursor = new Date();
  if (!doneByDate.get(toKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (doneByDate.get(toKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function checkInCount(doneByDate: Map<string, boolean>, month: string) {
  let count = 0;
  for (const [date, done] of doneByDate) {
    if (done && date.startsWith(month)) count += 1;
  }
  return count;
}
