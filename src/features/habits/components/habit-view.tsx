'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { setHabitEntryAction } from '@/features/habits/actions';
import { HabitFormDialog, type HabitInitial } from '@/features/habits/components/habit-form-dialog';
import type { HabitItem } from '@/features/habits/services/habit-service';

export function HabitView({ month, habits }: { month: string; habits: HabitItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; habit: HabitItem } | null
  >(null);

  const parts = month.split('-').map(Number);
  const year = parts[0] ?? new Date().getFullYear();
  const monthIndex = parts[1] ?? new Date().getMonth() + 1;
  const month0 = monthIndex - 1;
  const daysInMonth = new Date(year, month0 + 1, 0).getDate();
  const today = new Date();
  const todayKey = toKey(today);

  function goToMonth(offset: number) {
    const target = new Date(year, month0 + offset, 1);
    const params = new URLSearchParams(searchParams);
    params.set(
      'month',
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  async function toggle(habitId: string, date: string, done: boolean) {
    const result = await setHabitEntryAction({ habitId, date, done: !done });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
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
          <h1 suppressHydrationWarning className="text-lg font-semibold">
            {new Date(year, month0, 1).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </h1>
        </div>
        <Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
          <Plus className="size-4" />
          New habit
        </Button>
      </div>

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
                      day.key === todayKey ? 'text-primary' : 'text-muted-foreground'
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
                      <div className="text-muted-foreground text-[10px]">{summary}</div>
                    </td>
                    {days.map((day) => {
                      const done = doneByDate.get(day.key) ?? false;
                      const isFuture = day.key > todayKey;
                      return (
                        <td key={day.key} className="border-t px-0.5 py-2 text-center">
                          <button
                            type="button"
                            disabled={isFuture}
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
