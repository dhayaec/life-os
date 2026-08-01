import 'server-only';

import { db } from '@/server/db';

export type SearchHit = {
  id: string;
  group: 'Notes' | 'Tasks' | 'Events' | 'Journal' | 'Habits' | 'Bookmarks';
  title: string;
  subtitle: string | null;
  href: string;
};

export async function globalSearch(
  userId: string,
  q: string,
  limitPerType = 5
): Promise<SearchHit[]> {
  const query = q.trim();
  if (!query) return [];

  // Tokenize so "buy milk" matches rows containing both words in any order
  // (substring search required the exact phrase). Every token must match
  // somewhere across the searched fields, case-insensitively.
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const like = (token: string) => ({ contains: token, mode: 'insensitive' as const });

  const [notes, tasks, events, journal, habits, bookmarks] = await Promise.all([
    db.note.findMany({
      where: {
        userId,
        trashedAt: null,
        AND: tokens.map((token) => ({
          OR: [{ title: like(token) }, { content: like(token) }],
        })),
      },
      select: { id: true, title: true },
      take: limitPerType,
    }),
    db.task.findMany({
      where: {
        userId,
        AND: tokens.map((token) => ({
          OR: [{ title: like(token) }, { description: like(token) }],
        })),
      },
      select: { id: true, title: true },
      take: limitPerType,
    }),
    db.calendarEvent.findMany({
      where: { userId, AND: tokens.map((token) => ({ title: like(token) })) },
      select: { id: true, title: true },
      take: limitPerType,
    }),
    db.journalEntry.findMany({
      where: {
        userId,
        AND: tokens.map((token) => ({
          OR: [{ title: like(token) }, { content: like(token) }],
        })),
      },
      select: { id: true, title: true, content: true },
      take: limitPerType,
    }),
    db.habit.findMany({
      where: { userId, AND: tokens.map((token) => ({ name: like(token) })) },
      select: { id: true, name: true },
      take: limitPerType,
    }),
    db.bookmark.findMany({
      where: {
        userId,
        AND: tokens.map((token) => ({
          OR: [{ title: like(token) }, { url: like(token) }],
        })),
      },
      select: { id: true, title: true, url: true },
      take: limitPerType,
    }),
  ]);

  const hits: SearchHit[] = [];

  for (const note of notes) {
    hits.push({
      id: note.id,
      group: 'Notes',
      title: note.title,
      subtitle: null,
      href: `/notes/${note.id}`,
    });
  }
  for (const task of tasks) {
    hits.push({
      id: task.id,
      group: 'Tasks',
      title: task.title,
      subtitle: null,
      href: '/tasks',
    });
  }
  for (const event of events) {
    hits.push({
      id: event.id,
      group: 'Events',
      title: event.title,
      subtitle: null,
      href: '/calendar',
    });
  }
  for (const entry of journal) {
    hits.push({
      id: entry.id,
      group: 'Journal',
      title: entry.title ?? 'Untitled entry',
      subtitle: entry.content.slice(0, 80),
      href: '/journal',
    });
  }
  for (const habit of habits) {
    hits.push({
      id: habit.id,
      group: 'Habits',
      title: habit.name,
      subtitle: null,
      href: '/habits',
    });
  }
  for (const bookmark of bookmarks) {
    hits.push({
      id: bookmark.id,
      group: 'Bookmarks',
      title: bookmark.title,
      subtitle: bookmark.url,
      href: '/bookmarks',
    });
  }

  return hits;
}
