import 'server-only';

import { db } from '@/server/db';
import { getFinanceOverview } from '@/features/finance/services/finance-service';
import { currentStreak, toKey } from '@/features/dashboard/services/streak';

export type AgendaEvent = {
  id: string;
  title: string;
  startAt: string;
  allDay: boolean;
  color: string;
};

export type AgendaTask = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
};

export type RecentNote = {
  id: string;
  title: string;
  updatedAt: string;
};

export type HabitStreak = {
  id: string;
  name: string;
  currentStreak: number;
};

export type DashboardData = {
  todayLabel: string;
  agendaEvents: AgendaEvent[];
  agendaTasks: AgendaTask[];
  upcomingEvents: AgendaEvent[];
  dueTasks: AgendaTask[];
  recentNotes: RecentNote[];
  habitStreaks: HabitStreak[];
  finance: { income: number; expense: number; balance: number };
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [todayEvents, upcomingEvents, dueTasks, recentNotes, habits, finance] = await Promise.all([
    db.calendarEvent.findMany({
      where: { userId, startAt: { gte: startOfDay, lt: startOfTomorrow } },
      orderBy: { startAt: 'asc' },
      take: 10,
    }),
    db.calendarEvent.findMany({
      where: { userId, startAt: { gte: startOfDay } },
      orderBy: { startAt: 'asc' },
      take: 5,
    }),
    db.task.findMany({
      where: { userId, status: { not: 'done' }, dueAt: { lt: startOfTomorrow } },
      orderBy: { dueAt: 'asc' },
      take: 8,
    }),
    db.note.findMany({
      where: { userId, trashedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true },
      take: 5,
    }),
    db.habit.findMany({
      where: { userId },
      include: { entries: { where: { done: true }, select: { date: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    getFinanceOverview(userId, now.getFullYear(), now.getMonth() + 1),
  ]);

  const serializeEvent = (event: (typeof todayEvents)[number]): AgendaEvent => ({
    id: event.id,
    title: event.title,
    startAt: event.startAt.toISOString(),
    allDay: event.allDay,
    color: event.color,
  });

  const serializeTask = (task: (typeof dueTasks)[number]): AgendaTask => ({
    id: task.id,
    title: task.title,
    status: task.status,
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
  });

  const todayKeyValue = toKey(startOfDay);
  const habitStreaks = habits
    .map((habit) => ({
      id: habit.id,
      name: habit.name,
      currentStreak: currentStreak(
        habit.entries.map((entry) => toKey(entry.date)),
        todayKeyValue
      ),
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 5);

  return {
    todayLabel: startOfDay.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    agendaEvents: todayEvents.map(serializeEvent),
    agendaTasks: dueTasks
      .filter((task) => task.dueAt && task.dueAt >= startOfDay)
      .map(serializeTask),
    upcomingEvents: upcomingEvents.map(serializeEvent),
    dueTasks: dueTasks.map(serializeTask),
    recentNotes: recentNotes.map((note) => ({
      id: note.id,
      title: note.title,
      updatedAt: note.updatedAt.toISOString(),
    })),
    habitStreaks,
    finance: {
      income: finance.summary.income,
      expense: finance.summary.expense,
      balance: finance.summary.balance,
    },
  };
}
