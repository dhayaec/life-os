import 'server-only';

import type { JournalEntry, Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type JournalMood = 'terrible' | 'bad' | 'okay' | 'good' | 'great';

export type JournalEntryItem = {
  id: string;
  title: string | null;
  content: string;
  mood: JournalMood;
  entryAt: string;
  createdAt: string;
};

type JournalEntryRow = JournalEntry;

function serializeEntry(entry: JournalEntryRow): JournalEntryItem {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    entryAt: entry.entryAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getJournalEntries(userId: string, limit = 100): Promise<JournalEntryItem[]> {
  const entries = await db.journalEntry.findMany({
    where: { userId },
    orderBy: { entryAt: 'desc' },
    take: limit,
  });
  return entries.map(serializeEntry);
}

export async function getJournalEntry(
  userId: string,
  id: string
): Promise<JournalEntryItem | null> {
  const entry = await db.journalEntry.findFirst({ where: { id, userId } });
  return entry ? serializeEntry(entry) : null;
}

export type JournalEntryInput = {
  title?: string | null | undefined;
  content: string;
  mood?: JournalMood | undefined;
  entryAt?: string | undefined;
};

export type JournalEntryUpdateInput = {
  title?: string | null | undefined;
  content?: string | undefined;
  mood?: JournalMood | undefined;
  entryAt?: string | undefined;
};

export async function createJournalEntry(userId: string, input: JournalEntryInput) {
  const entry = await db.journalEntry.create({
    data: {
      userId,
      title: input.title ?? null,
      content: input.content,
      mood: input.mood ?? 'okay',
      entryAt: input.entryAt ? new Date(input.entryAt) : new Date(),
    },
  });
  return serializeEntry(entry);
}

export async function updateJournalEntry(
  userId: string,
  id: string,
  input: JournalEntryUpdateInput
) {
  const existing = await db.journalEntry.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.JournalEntryUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.mood !== undefined) data.mood = input.mood;
  if (input.entryAt !== undefined) data.entryAt = new Date(input.entryAt);

  if (Object.keys(data).length > 0) {
    await db.journalEntry.update({ where: { id }, data });
  }

  return getJournalEntry(userId, id);
}

export async function deleteJournalEntry(userId: string, id: string) {
  return db.journalEntry.delete({ where: { id, userId } });
}
