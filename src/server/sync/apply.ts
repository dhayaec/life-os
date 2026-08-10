import 'server-only';

import { del } from '@vercel/blob';

import type { Prisma } from '@/generated/prisma/client';

import {
  serializeBookmark,
  serializeCollection,
  type BookmarkTypeLiteral,
} from '@/features/bookmarks/services/bookmark-service';
import { serializeEvent } from '@/features/calendar/services/calendar-service';
import { serializeDocument } from '@/features/documents/services/documents-service';
import {
  serializeBudget,
  serializeTransaction,
  type TransactionTypeLiteral,
} from '@/features/finance/services/finance-service';
import { serializeHabit, type HabitFrequency } from '@/features/habits/services/habit-service';
import { serializeEntry, type JournalMood } from '@/features/journal/services/journal-service';
import { serializeFolder, serializeNote, setTags } from '@/features/notes/services/note-service';
import { serializeNotification } from '@/features/notifications/services/notifications-service';
import { serializeSettings } from '@/features/settings/services/settings-service';
import { serializeShoppingItem } from '@/features/shopping/services/shopping-service';
import {
  serializeTask,
  setLabels,
  type TaskPriority,
  type TaskStatus,
} from '@/features/tasks/services/task-service';
import type { Domain, Row, SyncOpEnvelope, SyncOpResult } from '@/lib/sync/types';

/**
 * Apply a single push op inside a transaction. Last-write-wins: the op wins iff
 * its logical timestamp is strictly newer than the stored row's `updatedAt` (or
 * the row is absent). Equal timestamps resolve to the server. Rows written here
 * take server-now for `updatedAt` (never the client timestamp), so watermark
 * progress stays monotonic.
 */
export async function applyOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  switch (op.domain) {
    case 'tasks':
      return applyTaskOp(tx, userId, op);
    case 'notes':
      return applyNoteOp(tx, userId, op);
    case 'folders':
      return applyFolderOp(tx, userId, op);
    case 'calendarEvents':
      return applyEventOp(tx, userId, op);
    case 'habits':
      return applyHabitOp(tx, userId, op);
    case 'journalEntries':
      return applyEntryOp(tx, userId, op);
    case 'transactions':
      return applyTransactionOp(tx, userId, op);
    case 'budgets':
      return applyBudgetOp(tx, userId, op);
    case 'shoppingItems':
      return applyShoppingOp(tx, userId, op);
    case 'bookmarks':
      return applyBookmarkOp(tx, userId, op);
    case 'collections':
      return applyCollectionOp(tx, userId, op);
    case 'documents':
      return applyDocumentOp(tx, userId, op);
    case 'notifications':
      return applyNotificationOp(tx, userId, op);
    case 'settings':
      return applySettingsOp(tx, userId, op);
    case 'habitEntries':
      return { status: 'error', error: 'Habit entries sync through their habit.' };
    default:
      return { status: 'error', error: `Sync for domain "${op.domain}" is not implemented yet.` };
  }
}

function opTimeOf(op: SyncOpEnvelope): number {
  const value = op.payload['updatedAt'] ?? op.payload['deletedAt'] ?? op.createdAt;
  return new Date(String(value)).getTime();
}

function labelNamesOf(payload: Record<string, unknown>): string[] {
  if (Array.isArray(payload['labelNames'])) {
    return payload['labelNames'].map((name) => String(name)).filter(Boolean);
  }
  if (Array.isArray(payload['labels'])) {
    return payload['labels']
      .map((label) => String((label as { name?: unknown }).name))
      .filter(Boolean);
  }
  return [];
}

function tagNamesOf(payload: Record<string, unknown>): string[] {
  if (Array.isArray(payload['tagNames'])) {
    return payload['tagNames'].map((name) => String(name)).filter(Boolean);
  }
  return [];
}

type ExistingRow = { updatedAt: Date };
type FindExisting = (tx: Prisma.TransactionClient, recordId: string) => Promise<ExistingRow | null>;
type RemoveRow = (tx: Prisma.TransactionClient, recordId: string) => Promise<unknown>;
type ReadCanonical = (
  tx: Prisma.TransactionClient,
  userId: string,
  recordId: string
) => Promise<Row | null>;

async function writeTombstone(
  tx: Prisma.TransactionClient,
  userId: string,
  domain: Domain,
  recordId: string
): Promise<{ domain: Domain; recordId: string; deletedAt: string }> {
  const deletedAt = new Date();
  const row = await tx.syncTombstone.upsert({
    where: { userId_domain_recordId: { userId, domain, recordId } },
    update: { deletedAt },
    create: { userId, domain, recordId, deletedAt },
  });
  return { domain, recordId, deletedAt: row.deletedAt.toISOString() };
}

/**
 * Shared delete path. A tombstone is written only when the delete wins the LWW
 * (row absent, or the op is strictly newer). Writing one on a loss would tell
 * other devices to delete a row the server kept.
 */
async function applyDelete(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope,
  findExisting: FindExisting,
  remove: RemoveRow,
  readCanonical: ReadCanonical
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);
  const existing = await findExisting(tx, recordId);
  const wins = !existing || opTime > existing.updatedAt.getTime();

  if (!wins) {
    const record = await readCanonical(tx, userId, recordId);
    return record ? { status: 'conflict', record } : { status: 'applied' };
  }

  if (existing) await remove(tx, recordId);
  const tombstone = await writeTombstone(tx, userId, op.domain, recordId);
  return { status: 'applied', tombstone };
}

// --- Tasks ---

async function readTask(tx: Prisma.TransactionClient, userId: string, id: string) {
  const task = await tx.task.findFirst({
    where: { id, userId },
    include: { labels: { include: { label: true } } },
  });
  return task ? serializeTask(task) : null;
}

async function applyTaskOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.task.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readTask(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const task = await tx.task.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          title: String(op.payload['title'] ?? 'Untitled'),
          description: (op.payload['description'] as string | null) ?? null,
          status: (op.payload['status'] as TaskStatus) ?? 'todo',
          priority: (op.payload['priority'] as TaskPriority) ?? 'medium',
          dueAt: op.payload['dueAt'] ? new Date(String(op.payload['dueAt'])) : null,
          completedAt: op.payload['status'] === 'done' ? new Date() : null,
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const names = labelNamesOf(op.payload);
      if (names.length) await setLabels(tx, userId, task.id, names);
      const canonical = await readTask(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.task.findFirst({ where: { id: recordId, userId } });
      if (!existing) {
        const task = await tx.task.create({
          data: {
            id: recordId,
            userId,
            title: String(op.payload['title'] ?? 'Untitled'),
            description: (op.payload['description'] as string | null) ?? null,
            status: (op.payload['status'] as TaskStatus) ?? 'todo',
            priority: (op.payload['priority'] as TaskPriority) ?? 'medium',
            dueAt: op.payload['dueAt'] ? new Date(String(op.payload['dueAt'])) : null,
            completedAt: op.payload['status'] === 'done' ? new Date() : null,
          },
        });
        if (labelNamesOf(op.payload).length) {
          await setLabels(tx, userId, task.id, labelNamesOf(op.payload));
        }
        const canonical = await readTask(tx, userId, recordId);
        return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
      }
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readTask(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.TaskUncheckedUpdateInput = {};
      if (op.payload['title'] !== undefined) data.title = String(op.payload['title']);
      if (op.payload['description'] !== undefined) {
        data.description = op.payload['description'] as string | null;
      }
      if (op.payload['status'] !== undefined) data.status = op.payload['status'] as TaskStatus;
      if (op.payload['priority'] !== undefined) {
        data.priority = op.payload['priority'] as TaskPriority;
      }
      if (op.payload['dueAt'] !== undefined) {
        data.dueAt = op.payload['dueAt'] ? new Date(String(op.payload['dueAt'])) : null;
      }

      const nextStatus = (op.payload['status'] as TaskStatus | undefined) ?? existing.status;
      if (op.payload['status'] !== undefined) {
        if (nextStatus === 'done' && !existing.completedAt) data.completedAt = new Date();
        if (nextStatus !== 'done') data.completedAt = null;
      }

      if (Object.keys(data).length > 0) {
        await tx.task.update({ where: { id: recordId }, data });
      }
      if (op.payload['labelNames'] !== undefined || op.payload['labels'] !== undefined) {
        await setLabels(tx, userId, recordId, labelNamesOf(op.payload));
      }

      const canonical = await readTask(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) => t.task.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.task.delete({ where: { id: recordId } }),
        readTask
      );
    }
  }
}

// --- Notes ---

async function readNote(tx: Prisma.TransactionClient, userId: string, id: string) {
  const note = await tx.note.findFirst({
    where: { id, userId },
    include: { tags: { include: { tag: true } } },
  });
  return note ? serializeNote(note) : null;
}

async function folderExists(tx: Prisma.TransactionClient, userId: string, id: string) {
  return (await tx.folder.findFirst({ where: { id, userId }, select: { id: true } })) !== null;
}

async function applyNoteOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.note.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readNote(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const folderId = op.payload['folderId'] as string | null | undefined;
      if (folderId && !(await folderExists(tx, userId, folderId))) {
        return { status: 'error', error: 'Folder not found' };
      }
      const note = await tx.note.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          title: String(op.payload['title'] ?? ''),
          content: String(op.payload['content'] ?? ''),
          folderId: folderId ?? null,
          isFavorite: Boolean(op.payload['isFavorite'] ?? false),
          archived: Boolean(op.payload['archived'] ?? false),
          trashedAt: op.payload['trashedAt'] ? new Date(String(op.payload['trashedAt'])) : null,
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const names = tagNamesOf(op.payload);
      if (names.length) await setTags(tx, userId, note.id, names);
      const canonical = await readNote(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.note.findFirst({ where: { id: recordId, userId } });
      if (!existing) {
        const note = await tx.note.create({
          data: {
            id: recordId,
            userId,
            title: String(op.payload['title'] ?? ''),
            content: String(op.payload['content'] ?? ''),
            folderId: (op.payload['folderId'] as string | null | undefined) ?? null,
            isFavorite: Boolean(op.payload['isFavorite'] ?? false),
            archived: Boolean(op.payload['archived'] ?? false),
          },
        });
        if (op.payload['tagNames'] !== undefined) {
          await setTags(tx, userId, note.id, tagNamesOf(op.payload));
        }
        const canonical = await readNote(tx, userId, recordId);
        return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
      }
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readNote(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.NoteUncheckedUpdateInput = {};
      if (op.payload['title'] !== undefined) data.title = String(op.payload['title']);
      if (op.payload['content'] !== undefined) data.content = String(op.payload['content']);
      if (op.payload['folderId'] !== undefined) {
        const folderId = op.payload['folderId'] as string | null;
        if (folderId && !(await folderExists(tx, userId, folderId))) {
          return { status: 'error', error: 'Folder not found' };
        }
        data.folderId = folderId;
      }
      if (op.payload['isFavorite'] !== undefined) {
        data.isFavorite = Boolean(op.payload['isFavorite']);
      }
      if (op.payload['archived'] !== undefined) data.archived = Boolean(op.payload['archived']);
      if (op.payload['trashedAt'] !== undefined) {
        data.trashedAt = op.payload['trashedAt'] ? new Date(String(op.payload['trashedAt'])) : null;
      }

      if (Object.keys(data).length > 0) {
        await tx.note.update({ where: { id: recordId }, data });
      }
      if (op.payload['tagNames'] !== undefined) {
        await setTags(tx, userId, recordId, tagNamesOf(op.payload));
      }

      const canonical = await readNote(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) => t.note.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.note.delete({ where: { id: recordId } }),
        readNote
      );
    }
  }
}

// --- Folders ---

async function readFolder(tx: Prisma.TransactionClient, userId: string, id: string) {
  const folder = await tx.folder.findFirst({ where: { id, userId } });
  return folder ? serializeFolder(folder) : null;
}

async function applyFolderOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.folder.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readFolder(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const parentId = op.payload['parentId'] as string | null | undefined;
      if (parentId && !(await folderExists(tx, userId, parentId))) {
        return { status: 'error', error: 'Parent folder not found' };
      }
      const folder = await tx.folder.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          name: String(op.payload['name'] ?? 'Untitled'),
          parentId: parentId ?? null,
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readFolder(tx, userId, folder.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.folder.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Folder not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readFolder(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const data: Prisma.FolderUncheckedUpdateInput = {};
      if (op.payload['name'] !== undefined) data.name = String(op.payload['name']);
      if (op.payload['parentId'] !== undefined) {
        const parentId = op.payload['parentId'] as string | null;
        if (parentId && !(await folderExists(tx, userId, parentId))) {
          return { status: 'error', error: 'Parent folder not found' };
        }
        data.parentId = parentId;
      }
      if (Object.keys(data).length > 0) {
        await tx.folder.update({ where: { id: recordId }, data });
      }
      const canonical = await readFolder(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) => t.folder.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.folder.delete({ where: { id: recordId } }),
        readFolder
      );
    }
  }
}

// --- Calendar events ---

async function readEvent(tx: Prisma.TransactionClient, userId: string, id: string) {
  const event = await tx.calendarEvent.findFirst({ where: { id, userId } });
  return event ? serializeEvent(event) : null;
}

async function applyEventOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.calendarEvent.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readEvent(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const event = await tx.calendarEvent.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          title: String(op.payload['title'] ?? 'Untitled'),
          description: (op.payload['description'] as string | null) ?? null,
          startAt: new Date(String(op.payload['startAt'] ?? new Date().toISOString())),
          endAt: op.payload['endAt'] ? new Date(String(op.payload['endAt'])) : null,
          allDay: Boolean(op.payload['allDay'] ?? false),
          location: (op.payload['location'] as string | null) ?? null,
          color: String(op.payload['color'] ?? '#6366f1'),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readEvent(tx, userId, event.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.calendarEvent.findFirst({ where: { id: recordId, userId } });
      if (!existing) {
        const event = await tx.calendarEvent.create({
          data: {
            id: recordId,
            userId,
            title: String(op.payload['title'] ?? 'Untitled'),
            description: (op.payload['description'] as string | null) ?? null,
            startAt: new Date(String(op.payload['startAt'] ?? new Date().toISOString())),
            endAt: op.payload['endAt'] ? new Date(String(op.payload['endAt'])) : null,
            allDay: Boolean(op.payload['allDay'] ?? false),
            location: (op.payload['location'] as string | null) ?? null,
            color: String(op.payload['color'] ?? '#6366f1'),
          },
        });
        const canonical = await readEvent(tx, userId, event.id);
        return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
      }
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readEvent(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.CalendarEventUncheckedUpdateInput = {};
      if (op.payload['title'] !== undefined) data.title = String(op.payload['title']);
      if (op.payload['description'] !== undefined) {
        data.description = op.payload['description'] as string | null;
      }
      if (op.payload['startAt'] !== undefined) {
        data.startAt = new Date(String(op.payload['startAt']));
      }
      if (op.payload['endAt'] !== undefined) {
        data.endAt = op.payload['endAt'] ? new Date(String(op.payload['endAt'])) : null;
      }
      if (op.payload['allDay'] !== undefined) data.allDay = Boolean(op.payload['allDay']);
      if (op.payload['location'] !== undefined) {
        data.location = op.payload['location'] as string | null;
      }
      if (op.payload['color'] !== undefined) data.color = String(op.payload['color']);

      if (Object.keys(data).length > 0) {
        await tx.calendarEvent.update({ where: { id: recordId }, data });
      }

      const canonical = await readEvent(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.calendarEvent.findFirst({
            where: { id: recordId, userId },
            select: { updatedAt: true },
          }),
        (t) => t.calendarEvent.delete({ where: { id: recordId } }),
        readEvent
      );
    }
  }
}

// --- Habits (entries embedded) ---

async function readHabit(tx: Prisma.TransactionClient, userId: string, id: string) {
  const habit = await tx.habit.findFirst({ where: { id, userId }, include: { entries: true } });
  return habit ? serializeHabit(habit) : null;
}

async function upsertHabitEntries(tx: Prisma.TransactionClient, habitId: string, entries: unknown) {
  if (!Array.isArray(entries)) return;
  for (const raw of entries) {
    const entry = raw as { date?: unknown; done?: unknown };
    if (typeof entry.date !== 'string') continue;
    const date = new Date(`${entry.date}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) continue;
    await tx.habitEntry.upsert({
      where: { habitId_date: { habitId, date } },
      update: { done: Boolean(entry.done) },
      create: { habitId, date, done: Boolean(entry.done) },
    });
  }
}

async function applyHabitOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.habit.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readHabit(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const habit = await tx.habit.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          name: String(op.payload['name'] ?? 'Untitled'),
          frequency: (op.payload['frequency'] as HabitFrequency) ?? 'daily',
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      await upsertHabitEntries(tx, habit.id, op.payload['entries']);
      const canonical = await readHabit(tx, userId, habit.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.habit.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Habit not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readHabit(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.HabitUncheckedUpdateInput = {};
      if (op.payload['name'] !== undefined) data.name = String(op.payload['name']);
      if (op.payload['frequency'] !== undefined) {
        data.frequency = op.payload['frequency'] as HabitFrequency;
      }
      if (Object.keys(data).length > 0) {
        await tx.habit.update({ where: { id: recordId }, data });
      }
      await upsertHabitEntries(tx, recordId, op.payload['entries']);

      const canonical = await readHabit(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) => t.habit.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.habit.delete({ where: { id: recordId } }),
        readHabit
      );
    }
  }
}

// --- Journal entries ---

async function readEntry(tx: Prisma.TransactionClient, userId: string, id: string) {
  const entry = await tx.journalEntry.findFirst({ where: { id, userId } });
  return entry ? serializeEntry(entry) : null;
}

async function applyEntryOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.journalEntry.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readEntry(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const entry = await tx.journalEntry.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          title: (op.payload['title'] as string | null) ?? null,
          content: String(op.payload['content'] ?? ''),
          mood: (op.payload['mood'] as JournalMood) ?? 'okay',
          entryAt: new Date(String(op.payload['entryAt'] ?? new Date().toISOString())),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readEntry(tx, userId, entry.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.journalEntry.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Journal entry not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readEntry(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.JournalEntryUncheckedUpdateInput = {};
      if (op.payload['title'] !== undefined) data.title = op.payload['title'] as string | null;
      if (op.payload['content'] !== undefined) data.content = String(op.payload['content']);
      if (op.payload['mood'] !== undefined) data.mood = op.payload['mood'] as JournalMood;
      if (op.payload['entryAt'] !== undefined) {
        data.entryAt = new Date(String(op.payload['entryAt']));
      }

      if (Object.keys(data).length > 0) {
        await tx.journalEntry.update({ where: { id: recordId }, data });
      }

      const canonical = await readEntry(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.journalEntry.findFirst({
            where: { id: recordId, userId },
            select: { updatedAt: true },
          }),
        (t) => t.journalEntry.delete({ where: { id: recordId } }),
        readEntry
      );
    }
  }
}

// --- Finance transactions ---

async function readTransaction(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.financeTransaction.findFirst({ where: { id, userId } });
  return row ? serializeTransaction(row) : null;
}

async function applyTransactionOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.financeTransaction.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readTransaction(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const row = await tx.financeTransaction.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          amount: Number(op.payload['amount'] ?? 0),
          type: (op.payload['type'] as TransactionTypeLiteral) ?? 'expense',
          category: String(op.payload['category'] ?? ''),
          date: new Date(`${String(op.payload['date'] ?? '1970-01-01')}T00:00:00Z`),
          note: (op.payload['note'] as string | null) ?? null,
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readTransaction(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.financeTransaction.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Transaction not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readTransaction(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.FinanceTransactionUncheckedUpdateInput = {};
      if (op.payload['amount'] !== undefined) data.amount = Number(op.payload['amount']);
      if (op.payload['type'] !== undefined) {
        data.type = op.payload['type'] as TransactionTypeLiteral;
      }
      if (op.payload['category'] !== undefined) data.category = String(op.payload['category']);
      if (op.payload['date'] !== undefined) {
        data.date = new Date(`${String(op.payload['date'])}T00:00:00Z`);
      }
      if (op.payload['note'] !== undefined) data.note = op.payload['note'] as string | null;

      if (Object.keys(data).length > 0) {
        await tx.financeTransaction.update({ where: { id: recordId }, data });
      }

      const canonical = await readTransaction(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.financeTransaction.findFirst({
            where: { id: recordId, userId },
            select: { updatedAt: true },
          }),
        (t) => t.financeTransaction.delete({ where: { id: recordId } }),
        readTransaction
      );
    }
  }
}

// --- Budgets ---

async function readBudget(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.budget.findFirst({ where: { id, userId } });
  // spent is recomputed client-side from local transactions.
  return row ? serializeBudget(row, 0) : null;
}

async function applyBudgetOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.budget.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readBudget(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const row = await tx.budget.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          category: String(op.payload['category'] ?? ''),
          amount: Number(op.payload['amount'] ?? 0),
          month: String(op.payload['month'] ?? ''),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readBudget(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.budget.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Budget not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readBudget(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.BudgetUncheckedUpdateInput = {};
      if (op.payload['category'] !== undefined) data.category = String(op.payload['category']);
      if (op.payload['amount'] !== undefined) data.amount = Number(op.payload['amount']);
      if (op.payload['month'] !== undefined) data.month = String(op.payload['month']);

      if (Object.keys(data).length > 0) {
        await tx.budget.update({ where: { id: recordId }, data });
      }

      const canonical = await readBudget(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) => t.budget.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.budget.delete({ where: { id: recordId } }),
        readBudget
      );
    }
  }
}

// --- Shopping items ---

async function readShoppingItem(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.shoppingItem.findFirst({ where: { id, userId } });
  return row ? serializeShoppingItem(row) : null;
}

async function applyShoppingOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.shoppingItem.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readShoppingItem(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const row = await tx.shoppingItem.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          name: String(op.payload['name'] ?? ''),
          category: String(op.payload['category'] || 'Other'),
          quantity: Number(op.payload['quantity'] ?? 1),
          note: (op.payload['note'] as string | null) ?? null,
          completed: Boolean(op.payload['completed'] ?? false),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readShoppingItem(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.shoppingItem.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Shopping item not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readShoppingItem(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.ShoppingItemUncheckedUpdateInput = {};
      if (op.payload['name'] !== undefined) data.name = String(op.payload['name']);
      if (op.payload['category'] !== undefined) data.category = String(op.payload['category']);
      if (op.payload['quantity'] !== undefined) data.quantity = Number(op.payload['quantity']);
      if (op.payload['note'] !== undefined) data.note = op.payload['note'] as string | null;
      if (op.payload['completed'] !== undefined) {
        data.completed = Boolean(op.payload['completed']);
      }

      if (Object.keys(data).length > 0) {
        await tx.shoppingItem.update({ where: { id: recordId }, data });
      }

      const canonical = await readShoppingItem(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.shoppingItem.findFirst({
            where: { id: recordId, userId },
            select: { updatedAt: true },
          }),
        (t) => t.shoppingItem.delete({ where: { id: recordId } }),
        readShoppingItem
      );
    }
  }
}

// --- Bookmarks ---

async function readBookmark(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.bookmark.findFirst({ where: { id, userId } });
  return row ? serializeBookmark(row) : null;
}

async function collectionExists(tx: Prisma.TransactionClient, userId: string, id: string) {
  return (await tx.collection.findFirst({ where: { id, userId }, select: { id: true } })) !== null;
}

function tagsOf(payload: Record<string, unknown>): string[] {
  if (!Array.isArray(payload['tags'])) return [];
  return payload['tags'].map((tag) => String(tag)).filter(Boolean);
}

async function applyBookmarkOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.bookmark.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readBookmark(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const collectionId = op.payload['collectionId'] as string | null | undefined;
      if (collectionId && !(await collectionExists(tx, userId, collectionId))) {
        return { status: 'error', error: 'Collection not found' };
      }
      const row = await tx.bookmark.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          url: String(op.payload['url'] ?? ''),
          title: String(op.payload['title'] ?? ''),
          description: (op.payload['description'] as string | null) ?? null,
          type: (op.payload['type'] as BookmarkTypeLiteral) ?? 'website',
          collectionId: collectionId ?? null,
          tags: tagsOf(op.payload),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readBookmark(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.bookmark.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Bookmark not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readBookmark(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }

      const data: Prisma.BookmarkUncheckedUpdateInput = {};
      if (op.payload['url'] !== undefined) data.url = String(op.payload['url']);
      if (op.payload['title'] !== undefined) data.title = String(op.payload['title']);
      if (op.payload['description'] !== undefined) {
        data.description = op.payload['description'] as string | null;
      }
      if (op.payload['type'] !== undefined) {
        data.type = op.payload['type'] as BookmarkTypeLiteral;
      }
      if (op.payload['collectionId'] !== undefined) {
        const collectionId = op.payload['collectionId'] as string | null;
        if (collectionId && !(await collectionExists(tx, userId, collectionId))) {
          return { status: 'error', error: 'Collection not found' };
        }
        data.collectionId = collectionId;
      }
      if (op.payload['tags'] !== undefined) data.tags = tagsOf(op.payload);

      if (Object.keys(data).length > 0) {
        await tx.bookmark.update({ where: { id: recordId }, data });
      }

      const canonical = await readBookmark(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.bookmark.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.bookmark.delete({ where: { id: recordId } }),
        readBookmark
      );
    }
  }
}

// --- Collections ---

async function readCollection(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.collection.findFirst({ where: { id, userId } });
  return row ? serializeCollection(row) : null;
}

async function applyCollectionOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.collection.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readCollection(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const parentId = op.payload['parentId'] as string | null | undefined;
      if (parentId && !(await collectionExists(tx, userId, parentId))) {
        return { status: 'error', error: 'Parent collection not found' };
      }
      const row = await tx.collection.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          name: String(op.payload['name'] ?? 'Untitled'),
          parentId: parentId ?? null,
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readCollection(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.collection.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Collection not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readCollection(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const data: Prisma.CollectionUncheckedUpdateInput = {};
      if (op.payload['name'] !== undefined) data.name = String(op.payload['name']);
      if (op.payload['parentId'] !== undefined) {
        const parentId = op.payload['parentId'] as string | null;
        if (parentId && !(await collectionExists(tx, userId, parentId))) {
          return { status: 'error', error: 'Parent collection not found' };
        }
        data.parentId = parentId;
      }
      if (Object.keys(data).length > 0) {
        await tx.collection.update({ where: { id: recordId }, data });
      }
      const canonical = await readCollection(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.collection.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        (t) => t.collection.delete({ where: { id: recordId } }),
        readCollection
      );
    }
  }
}

// --- Documents ---

async function readDocument(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.document.findFirst({ where: { id, userId } });
  return row ? serializeDocument(row) : null;
}

async function applyDocumentOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.document.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readDocument(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const row = await tx.document.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          name: String(op.payload['name'] ?? ''),
          type: String(op.payload['type'] ?? 'application/octet-stream'),
          size: Number(op.payload['size'] ?? 0),
          url: String(op.payload['url'] ?? ''),
          pathname: String(op.payload['pathname'] ?? ''),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readDocument(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.document.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Document not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readDocument(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const data: Prisma.DocumentUncheckedUpdateInput = {};
      if (op.payload['isFavorite'] !== undefined) {
        data.isFavorite = Boolean(op.payload['isFavorite']);
      }
      if (op.payload['trashedAt'] !== undefined) {
        data.trashedAt = op.payload['trashedAt'] ? new Date(String(op.payload['trashedAt'])) : null;
      }
      if (Object.keys(data).length > 0) {
        await tx.document.update({ where: { id: recordId }, data });
      }
      const canonical = await readDocument(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.document.findFirst({ where: { id: recordId, userId }, select: { updatedAt: true } }),
        async (t) => {
          const row = await t.document.findUnique({ where: { id: recordId } });
          if (row?.pathname) {
            try {
              await del(row.pathname);
            } catch {
              // An orphaned blob is preferable to losing the deletion.
            }
          }
          await t.document.delete({ where: { id: recordId } });
        },
        readDocument
      );
    }
  }
}

// --- Notifications ---

async function readNotification(tx: Prisma.TransactionClient, userId: string, id: string) {
  const row = await tx.notification.findFirst({ where: { id, userId } });
  return row ? serializeNotification(row) : null;
}

async function applyNotificationOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  const recordId = String(op.payload['id']);
  const opTime = opTimeOf(op);

  switch (op.opType) {
    case 'create': {
      const existing = await tx.notification.findFirst({ where: { id: recordId, userId } });
      if (existing && opTime <= existing.updatedAt.getTime()) {
        const canonical = await readNotification(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const row = await tx.notification.upsert({
        where: { id: recordId },
        update: {},
        create: {
          id: recordId,
          userId,
          title: String(op.payload['title'] ?? ''),
          body: (op.payload['body'] as string | null) ?? null,
          type: String(op.payload['type'] ?? 'general'),
          createdAt: new Date(String(op.payload['createdAt'] ?? new Date().toISOString())),
        },
      });
      const canonical = await readNotification(tx, userId, row.id);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'update': {
      const existing = await tx.notification.findFirst({ where: { id: recordId, userId } });
      if (!existing) return { status: 'error', error: 'Notification not found' };
      if (opTime <= existing.updatedAt.getTime()) {
        const canonical = await readNotification(tx, userId, recordId);
        return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
      }
      const data: Prisma.NotificationUncheckedUpdateInput = {};
      if (op.payload['read'] !== undefined) data.read = Boolean(op.payload['read']);
      if (Object.keys(data).length > 0) {
        await tx.notification.update({ where: { id: recordId }, data });
      }
      const canonical = await readNotification(tx, userId, recordId);
      return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
    }

    case 'delete': {
      return applyDelete(
        tx,
        userId,
        op,
        (t) =>
          t.notification.findFirst({
            where: { id: recordId, userId },
            select: { updatedAt: true },
          }),
        (t) => t.notification.delete({ where: { id: recordId } }),
        readNotification
      );
    }
  }
}

// --- Settings ---

async function readSettings(tx: Prisma.TransactionClient, userId: string): Promise<Row | null> {
  const [user, settings] = await Promise.all([
    tx.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    tx.userSettings.findUnique({ where: { userId } }),
  ]);
  if (!user || !settings) return null;
  return serializeSettings(user, settings);
}

async function applySettingsOp(
  tx: Prisma.TransactionClient,
  userId: string,
  op: SyncOpEnvelope
): Promise<SyncOpResult> {
  if (op.opType === 'delete') {
    return { status: 'error', error: 'Settings cannot be deleted.' };
  }

  const existing = await tx.userSettings.findUnique({ where: { userId } });
  const opTime = opTimeOf(op);
  if (existing && opTime <= existing.updatedAt.getTime()) {
    const canonical = await readSettings(tx, userId);
    return canonical ? { status: 'conflict', record: canonical } : { status: 'applied' };
  }

  if (op.payload['name'] !== undefined) {
    await tx.user.update({ where: { id: userId }, data: { name: String(op.payload['name']) } });
  }

  const data = {
    theme: String(op.payload['theme'] ?? existing?.theme ?? 'system'),
    timezone: String(op.payload['timezone'] ?? existing?.timezone ?? 'UTC'),
    locale: String(op.payload['locale'] ?? existing?.locale ?? 'en'),
    emailNotifications: Boolean(
      op.payload['emailNotifications'] ?? existing?.emailNotifications ?? true
    ),
  };
  await tx.userSettings.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  const canonical = await readSettings(tx, userId);
  return { status: 'applied', ...(canonical ? { record: canonical } : {}) };
}
