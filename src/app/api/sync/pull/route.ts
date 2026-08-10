import { NextResponse } from 'next/server';
import { requireUser } from '@/server/session';
import { db } from '@/server/db';
import { serializeTask } from '@/features/tasks/services/task-service';
import { serializeNote, serializeFolder } from '@/features/notes/services/note-service';
import { serializeEvent } from '@/features/calendar/services/calendar-service';
import { serializeHabit } from '@/features/habits/services/habit-service';
import { serializeEntry } from '@/features/journal/services/journal-service';
import { serializeBudget, serializeTransaction } from '@/features/finance/services/finance-service';
import { serializeShoppingItem } from '@/features/shopping/services/shopping-service';
import {
  serializeBookmark,
  serializeCollection,
} from '@/features/bookmarks/services/bookmark-service';
import { serializeDocument } from '@/features/documents/services/documents-service';
import { serializeNotification } from '@/features/notifications/services/notifications-service';
import { serializeSettings } from '@/features/settings/services/settings-service';
import type { Domain, PullResponse } from '@/lib/sync/types';

export const maxDuration = 60;

export async function GET(request: Request) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const afterParam = url.searchParams.get('after');
  const afterDate = afterParam ? new Date(afterParam) : new Date(0);
  if (Number.isNaN(afterDate.getTime())) {
    return NextResponse.json({ error: 'Invalid after cursor' }, { status: 400 });
  }

  const domains: PullResponse['domains'] = {};
  let maxUpdatedAt = afterDate;

  const taskRows = await db.task.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    include: { labels: { include: { label: true } } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.tasks = { rows: taskRows.map(serializeTask), deleted: [] };
  for (const task of taskRows) {
    if (task.updatedAt > maxUpdatedAt) maxUpdatedAt = task.updatedAt;
  }

  const noteRows = await db.note.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    include: { tags: { include: { tag: true } } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.notes = { rows: noteRows.map(serializeNote), deleted: [] };
  for (const note of noteRows) {
    if (note.updatedAt > maxUpdatedAt) maxUpdatedAt = note.updatedAt;
  }

  const folderRows = await db.folder.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.folders = { rows: folderRows.map(serializeFolder), deleted: [] };
  for (const folder of folderRows) {
    if (folder.updatedAt > maxUpdatedAt) maxUpdatedAt = folder.updatedAt;
  }

  const eventRows = await db.calendarEvent.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.calendarEvents = { rows: eventRows.map(serializeEvent), deleted: [] };
  for (const event of eventRows) {
    if (event.updatedAt > maxUpdatedAt) maxUpdatedAt = event.updatedAt;
  }

  // Habits embed their entries. Pull a habit when the habit itself changed OR an
  // entry changed (entry toggles only bump the entry's updatedAt).
  const habitRows = await db.habit.findMany({
    where: { userId: user.id },
    include: { entries: true },
  });
  const changedHabits = habitRows.filter(
    (habit) =>
      habit.updatedAt >= afterDate || habit.entries.some((entry) => entry.updatedAt >= afterDate)
  );
  domains.habits = { rows: changedHabits.map(serializeHabit), deleted: [] };
  for (const habit of changedHabits) {
    if (habit.updatedAt > maxUpdatedAt) maxUpdatedAt = habit.updatedAt;
  }

  const journalRows = await db.journalEntry.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.journalEntries = { rows: journalRows.map(serializeEntry), deleted: [] };
  for (const entry of journalRows) {
    if (entry.updatedAt > maxUpdatedAt) maxUpdatedAt = entry.updatedAt;
  }

  const txRows = await db.financeTransaction.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.transactions = { rows: txRows.map(serializeTransaction), deleted: [] };
  for (const tx of txRows) {
    if (tx.updatedAt > maxUpdatedAt) maxUpdatedAt = tx.updatedAt;
  }

  // spent is recomputed client-side from local transactions, so a placeholder
  // here avoids a per-budget query on every pull.
  const budgetRows = await db.budget.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.budgets = { rows: budgetRows.map((budget) => serializeBudget(budget, 0)), deleted: [] };
  for (const budget of budgetRows) {
    if (budget.updatedAt > maxUpdatedAt) maxUpdatedAt = budget.updatedAt;
  }

  const shoppingRows = await db.shoppingItem.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.shoppingItems = { rows: shoppingRows.map(serializeShoppingItem), deleted: [] };
  for (const item of shoppingRows) {
    if (item.updatedAt > maxUpdatedAt) maxUpdatedAt = item.updatedAt;
  }

  const bookmarkRows = await db.bookmark.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.bookmarks = { rows: bookmarkRows.map(serializeBookmark), deleted: [] };
  for (const bookmark of bookmarkRows) {
    if (bookmark.updatedAt > maxUpdatedAt) maxUpdatedAt = bookmark.updatedAt;
  }

  const collectionRows = await db.collection.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.collections = { rows: collectionRows.map(serializeCollection), deleted: [] };
  for (const collection of collectionRows) {
    if (collection.updatedAt > maxUpdatedAt) maxUpdatedAt = collection.updatedAt;
  }

  const documentRows = await db.document.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.documents = { rows: documentRows.map(serializeDocument), deleted: [] };
  for (const document of documentRows) {
    if (document.updatedAt > maxUpdatedAt) maxUpdatedAt = document.updatedAt;
  }

  const notificationRows = await db.notification.findMany({
    where: { userId: user.id, updatedAt: { gte: afterDate } },
    orderBy: { updatedAt: 'asc' },
  });
  domains.notifications = { rows: notificationRows.map(serializeNotification), deleted: [] };
  for (const notification of notificationRows) {
    if (notification.updatedAt > maxUpdatedAt) maxUpdatedAt = notification.updatedAt;
  }

  const [settingsUser, settingsRow] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } }),
    db.userSettings.findUnique({ where: { userId: user.id } }),
  ]);
  if (settingsUser && settingsRow && settingsRow.updatedAt >= afterDate) {
    domains.settings = { rows: [serializeSettings(settingsUser, settingsRow)], deleted: [] };
    if (settingsRow.updatedAt > maxUpdatedAt) maxUpdatedAt = settingsRow.updatedAt;
  }

  const tombstones = await db.syncTombstone.findMany({
    where: { userId: user.id, deletedAt: { gte: afterDate } },
    select: { domain: true, recordId: true, deletedAt: true },
  });
  const tombstonesByDomain = new Map<Domain, { recordId: string; deletedAt: Date }[]>();
  for (const tombstone of tombstones) {
    const domain = tombstone.domain as Domain;
    const list = tombstonesByDomain.get(domain) ?? [];
    list.push({ recordId: tombstone.recordId, deletedAt: tombstone.deletedAt });
    tombstonesByDomain.set(domain, list);
    if (tombstone.deletedAt > maxUpdatedAt) maxUpdatedAt = tombstone.deletedAt;
  }
  for (const [domain, list] of tombstonesByDomain) {
    const existing = domains[domain];
    domains[domain] = {
      rows: existing?.rows ?? [],
      deleted: list.map((tombstone) => tombstone.recordId),
    };
  }

  return NextResponse.json({ after: maxUpdatedAt.toISOString(), domains });
}
