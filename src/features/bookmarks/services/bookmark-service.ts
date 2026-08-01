import 'server-only';

import type { Bookmark, Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type BookmarkTypeLiteral = 'article' | 'video' | 'repo' | 'website';

export type BookmarkItem = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  type: BookmarkTypeLiteral;
  collectionId: string | null;
  tags: string[];
  createdAt: string;
};

export type CollectionItem = {
  id: string;
  name: string;
  parentId: string | null;
};

type BookmarkRow = Bookmark;

function serializeBookmark(bookmark: BookmarkRow): BookmarkItem {
  return {
    id: bookmark.id,
    url: bookmark.url,
    title: bookmark.title,
    description: bookmark.description,
    type: bookmark.type,
    collectionId: bookmark.collectionId,
    tags: bookmark.tags,
    createdAt: bookmark.createdAt.toISOString(),
  };
}

export async function getCollections(userId: string): Promise<CollectionItem[]> {
  const collections = await db.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    parentId: collection.parentId,
  }));
}

export async function getBookmarks(userId: string, collectionId?: string): Promise<BookmarkItem[]> {
  const bookmarks = await db.bookmark.findMany({
    where: { userId, ...(collectionId ? { collectionId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  return bookmarks.map(serializeBookmark);
}

export async function getBookmark(userId: string, id: string): Promise<BookmarkItem | null> {
  const bookmark = await db.bookmark.findFirst({ where: { id, userId } });
  return bookmark ? serializeBookmark(bookmark) : null;
}

export type BookmarkInput = {
  url: string;
  title: string;
  description?: string | null | undefined;
  type?: BookmarkTypeLiteral | undefined;
  collectionId?: string | null | undefined;
  tags?: string[] | undefined;
};

export type BookmarkUpdateInput = {
  url?: string | undefined;
  title?: string | undefined;
  description?: string | null | undefined;
  type?: BookmarkTypeLiteral | undefined;
  collectionId?: string | null | undefined;
  tags?: string[] | undefined;
};

export async function createBookmark(userId: string, input: BookmarkInput) {
  const bookmark = await db.bookmark.create({
    data: {
      userId,
      url: input.url,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? 'website',
      collectionId: input.collectionId ?? null,
      tags: input.tags ?? [],
    },
  });
  return serializeBookmark(bookmark);
}

export async function updateBookmark(
  userId: string,
  id: string,
  input: BookmarkUpdateInput
): Promise<BookmarkItem | null> {
  const existing = await db.bookmark.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.BookmarkUncheckedUpdateInput = {};
  if (input.url !== undefined) data.url = input.url;
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.type !== undefined) data.type = input.type;
  if (input.collectionId !== undefined) data.collectionId = input.collectionId;
  if (input.tags !== undefined) data.tags = input.tags;

  if (Object.keys(data).length > 0) {
    await db.bookmark.update({ where: { id }, data });
  }

  return getBookmark(userId, id);
}

export async function deleteBookmark(userId: string, id: string) {
  return db.bookmark.delete({ where: { id, userId } });
}

export async function createCollection(
  userId: string,
  input: { name: string; parentId?: string | null | undefined }
): Promise<CollectionItem> {
  const collection = await db.collection.create({
    data: { userId, name: input.name, parentId: input.parentId ?? null },
  });
  return { id: collection.id, name: collection.name, parentId: collection.parentId };
}

export async function deleteCollection(userId: string, id: string) {
  return db.collection.delete({ where: { id, userId } });
}
