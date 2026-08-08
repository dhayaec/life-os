import 'server-only';

import type { Habit, HabitEntry, Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export type HabitEntryItem = {
  date: string;
  done: boolean;
};

export type HabitItem = {
  id: string;
  name: string;
  frequency: HabitFrequency;
  createdAt: string;
  entries: HabitEntryItem[];
};

type HabitRow = Habit & { entries: HabitEntry[] };

function serializeHabit(habit: HabitRow): HabitItem {
  return {
    id: habit.id,
    name: habit.name,
    frequency: habit.frequency,
    createdAt: habit.createdAt.toISOString(),
    entries: habit.entries.map((entry) => ({
      date: entry.date.toISOString().slice(0, 10),
      done: entry.done,
    })),
  };
}

export async function getHabits(userId: string, month: string): Promise<HabitItem[]> {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  const year = match ? Number(match[1]) : new Date().getFullYear();
  const monthNum = match ? Number(match[2]) : new Date().getMonth() + 1;
  const start = new Date(Date.UTC(year, monthNum - 1, 1));
  const end = new Date(Date.UTC(year, monthNum, 1));
  const habits = await db.habit.findMany({
    where: { userId },
    include: {
      entries: {
        where: { date: { gte: start, lt: end } },
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return habits.map(serializeHabit);
}

export async function getHabit(userId: string, id: string): Promise<HabitItem | null> {
  const habit = await db.habit.findFirst({
    where: { id, userId },
    include: { entries: true },
  });
  return habit ? serializeHabit(habit) : null;
}

export type HabitInput = {
  name: string;
  frequency?: HabitFrequency | undefined;
};

export type HabitUpdateInput = {
  name?: string | undefined;
  frequency?: HabitFrequency | undefined;
};

export async function createHabit(userId: string, input: HabitInput): Promise<HabitItem> {
  const habit = await db.habit.create({
    data: {
      userId,
      name: input.name,
      frequency: input.frequency ?? 'daily',
    },
    include: { entries: true },
  });
  return serializeHabit(habit);
}

export async function updateHabit(
  userId: string,
  id: string,
  input: HabitUpdateInput
): Promise<HabitItem | null> {
  const existing = await db.habit.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.HabitUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.frequency !== undefined) data.frequency = input.frequency;

  if (Object.keys(data).length > 0) {
    await db.habit.update({ where: { id }, data });
  }

  return getHabit(userId, id);
}

export async function deleteHabit(userId: string, id: string) {
  return db.habit.delete({ where: { id, userId } });
}

export async function setHabitEntry(
  userId: string,
  habitId: string,
  date: string,
  done: boolean
): Promise<HabitEntryItem | null> {
  const habit = await db.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) return null;

  const dateUtc = new Date(`${date}T00:00:00Z`);
  const entry = await db.habitEntry.upsert({
    where: { habitId_date: { habitId, date: dateUtc } },
    create: { habitId, date: dateUtc, done },
    update: { done },
  });
  return { date: entry.date.toISOString().slice(0, 10), done: entry.done };
}
