import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

type FolderInput = {
  name: string;
  parentId?: string | null;
};

type FolderRecord = Prisma.FolderGetPayload<Record<string, never>>;

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

export type SyncFolder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeFolder(folder: FolderRecord): SyncFolder {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

export async function createFolder(userId: string, data: FolderInput): Promise<SyncFolder> {
  if (data.parentId) await assertFolderOwned(userId, data.parentId);
  const folder = await db.folder.create({
    data: { userId, name: data.name, parentId: data.parentId ?? null },
  });
  return serializeFolder(folder);
}

export async function renameFolder(userId: string, id: string, name: string): Promise<SyncFolder> {
  const folder = await db.folder.update({
    where: { id, userId },
    data: { name },
  });
  return serializeFolder(folder);
}

export async function getFolderRows(userId: string): Promise<SyncFolder[]> {
  const folders = await db.folder.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  return folders.map(serializeFolder);
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

type NoteRecord = Prisma.NoteGetPayload<{
  include: { tags: { include: { tag: true } } };
}>;

export type SyncNote = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  isFavorite: boolean;
  archived: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tagNames: string[];
};

export function serializeNote(note: NoteRecord): SyncNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    folderId: note.folderId,
    isFavorite: note.isFavorite,
    archived: note.archived,
    trashedAt: note.trashedAt?.toISOString() ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    tagNames: note.tags.map(({ tag }) => tag.name),
  };
}

export async function setTags(
  client: Prisma.TransactionClient,
  userId: string,
  noteId: string,
  tagNames: string[]
) {
  await client.noteTag.deleteMany({ where: { noteId } });

  for (const name of tagNames) {
    const tag = await client.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    await client.noteTag.upsert({
      where: { noteId_tagId: { noteId, tagId: tag.id } },
      update: {},
      create: { noteId, tagId: tag.id },
    });
  }
}

export async function createNote(userId: string, input: NoteInput): Promise<SyncNote | null> {
  if (input.folderId) await assertFolderOwned(userId, input.folderId);
  const note = await db.note.create({
    data: {
      userId,
      title: input.title ?? '',
      content: input.content ?? '',
      folderId: input.folderId ?? null,
    },
  });

  if (input.tagNames?.length) {
    await setTags(db, userId, note.id, input.tagNames);
  }

  const created = await getNote(userId, note.id);
  return created ? serializeNote(created) : null;
}

export async function updateNote(
  userId: string,
  id: string,
  input: NoteInput
): Promise<SyncNote | null> {
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
    await setTags(db, userId, id, tagNames);
  }

  const updated = await getNote(userId, id);
  return updated ? serializeNote(updated) : null;
}

export async function toggleFavorite(userId: string, id: string): Promise<SyncNote | null> {
  const note = await db.note.findFirst({ where: { id, userId } });
  if (!note) return null;
  await db.note.update({ where: { id }, data: { isFavorite: !note.isFavorite } });
  const updated = await getNote(userId, id);
  return updated ? serializeNote(updated) : null;
}

export async function softDeleteNote(userId: string, id: string): Promise<SyncNote | null> {
  const note = await db.note.findFirst({ where: { id, userId } });
  if (!note) return null;
  await db.note.update({ where: { id }, data: { trashedAt: new Date(), archived: false } });
  const updated = await getNote(userId, id);
  return updated ? serializeNote(updated) : null;
}

export async function restoreNote(userId: string, id: string): Promise<SyncNote | null> {
  const note = await db.note.findFirst({ where: { id, userId } });
  if (!note) return null;
  await db.note.update({ where: { id }, data: { trashedAt: null } });
  const updated = await getNote(userId, id);
  return updated ? serializeNote(updated) : null;
}

export async function hardDeleteNote(userId: string, id: string) {
  return db.note.delete({ where: { id, userId } });
}
