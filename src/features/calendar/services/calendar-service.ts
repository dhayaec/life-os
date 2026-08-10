import 'server-only';

import type { CalendarEvent, Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  color: string;
  updatedAt: string;
};

type CalendarEventRow = CalendarEvent;

export function serializeEvent(event: CalendarEventRow): CalendarEventItem {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    allDay: event.allDay,
    location: event.location,
    color: event.color,
    updatedAt: event.updatedAt.toISOString(),
  };
}

export async function getEvents(userId: string, from: Date, to: Date) {
  const events = await db.calendarEvent.findMany({
    where: { userId, startAt: { gte: from, lt: to } },
    orderBy: [{ allDay: 'asc' }, { startAt: 'asc' }],
  });
  return events.map(serializeEvent);
}

export async function getEvent(userId: string, id: string) {
  const event = await db.calendarEvent.findFirst({ where: { id, userId } });
  return event ? serializeEvent(event) : null;
}

export type CalendarEventInput = {
  title: string;
  description?: string | null | undefined;
  startAt: string;
  endAt?: string | null | undefined;
  allDay?: boolean | undefined;
  location?: string | null | undefined;
  color?: string | undefined;
};

export type CalendarEventUpdateInput = {
  title?: string | undefined;
  description?: string | null | undefined;
  startAt?: string | undefined;
  endAt?: string | null | undefined;
  allDay?: boolean | undefined;
  location?: string | null | undefined;
  color?: string | undefined;
};

export async function createEvent(userId: string, input: CalendarEventInput) {
  const event = await db.calendarEvent.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      startAt: new Date(input.startAt),
      endAt: input.endAt ? new Date(input.endAt) : null,
      allDay: input.allDay ?? false,
      location: input.location ?? null,
      color: input.color ?? '#6366f1',
    },
  });
  return serializeEvent(event);
}

export async function updateEvent(userId: string, id: string, input: CalendarEventUpdateInput) {
  const existing = await db.calendarEvent.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.CalendarEventUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.startAt !== undefined) data.startAt = new Date(input.startAt);
  if (input.endAt !== undefined) data.endAt = input.endAt ? new Date(input.endAt) : null;
  if (input.allDay !== undefined) data.allDay = input.allDay;
  if (input.location !== undefined) data.location = input.location;
  if (input.color !== undefined) data.color = input.color;

  if (Object.keys(data).length > 0) {
    await db.calendarEvent.update({ where: { id }, data });
  }

  return getEvent(userId, id);
}

export async function deleteEvent(userId: string, id: string) {
  return db.calendarEvent.delete({ where: { id, userId } });
}
