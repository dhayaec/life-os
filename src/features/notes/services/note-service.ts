import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

type FolderInput = {
  name: string;
  parentId?: string | null;
};

export type FolderNode = {
  id: string;
  name: string;
  children: FolderNode[];
};

async function assertFolderOwned(userId: string, folderId: string) {
  const folder = await db.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  });
  if (!folder) throw new Error('Folder not found');
}

export async function getFolders(userId: string): Promise<FolderNode[]> {
  const folders = await db.folder.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  const nodes = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  for (const folder of folders) {
    nodes.set(folder.id, { id: folder.id, name: folder.name, children: [] });
  }
  for (const folder of folders) {
    const node = nodes.get(folder.id);
    if (!node) continue;
    const parent = folder.parentId ? nodes.get(folder.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function createFolder(userId: string, data: FolderInput) {
  if (data.parentId) await assertFolderOwned(userId, data.parentId);
  return db.folder.create({ data: { userId, name: data.name, parentId: data.parentId ?? null } });
}

export async function renameFolder(userId: string, id: string, name: string) {
  return db.folder.update({
    where: { id, userId },
    data: { name },
  });
}

export async function deleteFolder(userId: string, id: string) {
  // Prisma cascades children and set-nulls notes; orphaned notes are kept.
  return db.folder.delete({ where: { id, userId } });
}

export type NoteListOptions = {
  folderId?: string | null;
  search?: string;
  trashed?: boolean;
  archived?: boolean;
  favorite?: boolean;
  tag?: string;
  take?: number;
  cursor?: string;
};

function buildNotesWhere(userId: string, options: NoteListOptions): Prisma.NoteWhereInput {
  return {
    userId,
    trashedAt: options.trashed ? { not: null } : null,
    archived: options.archived ?? false,
    ...(options.folderId ? { folderId: options.folderId } : {}),
    ...(options.favorite ? { isFavorite: true } : {}),
    ...(options.search
      ? {
          OR: [
            { title: { contains: options.search, mode: 'insensitive' } },
            { content: { contains: options.search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(options.tag ? { tags: { some: { tag: { name: options.tag } } } } : {}),
  };
}

export async function getNotes(userId: string, options: NoteListOptions = {}) {
  return db.note.findMany({
    where: buildNotesWhere(userId, options),
    include: { tags: { include: { tag: true } } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: options.take ?? 50,
    ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
  });
}

const NOTES_PAGE_SIZE = 50;

export async function getNotesPage(userId: string, options: NoteListOptions = {}) {
  const limit = options.take ?? NOTES_PAGE_SIZE;
  const rows = await db.note.findMany({
    where: buildNotesWhere(userId, options),
    include: { tags: { include: { tag: true } } },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

export async function getNote(userId: string, id: string) {
  return db.note.findFirst({
    where: { id, userId },
    include: {
      tags: { include: { tag: true } },
      versions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function getNoteCount(userId: string) {
  return db.note.count({ where: { userId, trashedAt: null, archived: false } });
}

type NoteInput = {
  title?: string;
  content?: string;
  folderId?: string | null;
  isFavorite?: boolean;
  archived?: boolean;
  tagNames?: string[];
};

async function setTags(userId: string, noteId: string, tagNames: string[]) {
  await db.noteTag.deleteMany({ where: { noteId } });

  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    await db.noteTag.upsert({
      where: { noteId_tagId: { noteId, tagId: tag.id } },
      update: {},
      create: { noteId, tagId: tag.id },
    });
  }
}

export async function createNote(userId: string, input: NoteInput) {
  if (input.folderId) await assertFolderOwned(userId, input.folderId);
  const note = await db.note.create({
    data: {
      userId,
      title: input.title ?? 'Untitled',
      content: input.content ?? '',
      folderId: input.folderId ?? null,
    },
  });

  if (input.tagNames?.length) {
    await setTags(userId, note.id, input.tagNames);
  }

  return getNote(userId, note.id);
}

export async function updateNote(userId: string, id: string, input: NoteInput) {
  const existing = await db.note.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const { tagNames, ...rest } = input;
  if (rest.folderId) await assertFolderOwned(userId, rest.folderId);

  const data: Prisma.NoteUncheckedUpdateInput = {};
  if (rest.title !== undefined) data.title = rest.title;
  if (rest.content !== undefined) data.content = rest.content;
  if (rest.folderId !== undefined) data.folderId = rest.folderId;
  if (rest.isFavorite !== undefined) data.isFavorite = rest.isFavorite;
  if (rest.archived !== undefined) data.archived = rest.archived;

  if (Object.keys(data).length > 0) {
    if (rest.content !== undefined) {
      await db.noteVersion.create({ data: { noteId: id, content: existing.content } });
    }
    await db.note.update({ where: { id }, data });
  }

  if (tagNames) {
    await setTags(userId, id, tagNames);
  }

  return getNote(userId, id);
}

export async function toggleFavorite(userId: string, id: string) {
  const note = await db.note.findFirst({ where: { id, userId } });
  if (!note) return null;
  return db.note.update({ where: { id }, data: { isFavorite: !note.isFavorite } });
}

export async function softDeleteNote(userId: string, id: string) {
  return db.note.update({
    where: { id, userId },
    data: { trashedAt: new Date(), archived: false },
  });
}

export async function restoreNote(userId: string, id: string) {
  return db.note.update({ where: { id, userId }, data: { trashedAt: null } });
}

export async function hardDeleteNote(userId: string, id: string) {
  return db.note.delete({ where: { id, userId } });
}
