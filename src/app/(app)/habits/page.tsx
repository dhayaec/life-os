import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { HabitView } from '@/features/habits/components/habit-view';
import { getHabits } from '@/features/habits/services/habit-service';

export const metadata: Metadata = { title: 'Habits' };

export default async function HabitsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { month: monthParam } = await searchParams;

  const now = new Date();
  const match = /^(\d{4})-(\d{2})$/.exec(monthParam ?? '');
  const year = match ? Number(match[1]) : now.getFullYear();
  const month =
    match && Number(match[2]) >= 1 && Number(match[2]) <= 12
      ? Number(match[2])
      : now.getMonth() + 1;

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const habits = await getHabits(user.id, monthKey);

  return <HabitView month={monthKey} habits={habits} />;
}
