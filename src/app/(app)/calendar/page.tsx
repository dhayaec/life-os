import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { CalendarView } from '@/features/calendar/components/calendar-view';
import { getEvents } from '@/features/calendar/services/calendar-service';

export const metadata: Metadata = { title: 'Calendar' };

export default async function CalendarPage({
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

  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const events = await getEvents(user.id, from, to);

  return <CalendarView month={`${year}-${String(month).padStart(2, '0')}`} events={events} />;
}
