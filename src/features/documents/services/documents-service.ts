import 'server-only';

import { del, getDownloadUrl } from '@vercel/blob';

import { db } from '@/server/db';
import type { Document as DocumentRecord } from '@/generated/prisma/client';

export type DocumentItem = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  pathname: string;
  isFavorite: boolean;
  trashedAt: string | null;
  createdAt: string;
  downloadUrl: string;
};

export type UploadedDocumentData = {
  name: string;
  type: string;
  size: number;
  url: string;
  pathname: string;
};

function serialize(row: DocumentRecord) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    url: row.url,
    pathname: row.pathname,
    isFavorite: row.isFavorite,
    trashedAt: row.trashedAt ? row.trashedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDocuments(
  userId: string,
  options: { trashed?: boolean } = {}
): Promise<DocumentItem[]> {
  const { trashed = false } = options;
  const rows = await db.document.findMany({
    where: {
      userId,
      ...(trashed ? { trashedAt: { not: null } } : { trashedAt: null }),
    },
    orderBy: [{ isFavorite: 'desc' }, { createdAt: 'desc' }],
  });
  return rows.map((row) => ({
    ...serialize(row),
    downloadUrl: getDownloadUrl(row.pathname),
  }));
}

export async function createDocument(userId: string, input: UploadedDocumentData): Promise<void> {
  await db.document.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      size: input.size,
      url: input.url,
      pathname: input.pathname,
    },
  });
}

export async function toggleDocumentFavorite(userId: string, id: string): Promise<void> {
  const row = await db.document.findUniqueOrThrow({ where: { id, userId } });
  await db.document.update({
    where: { id, userId },
    data: { isFavorite: !row.isFavorite },
  });
}

export async function trashDocument(userId: string, id: string): Promise<void> {
  await db.document.update({
    where: { id, userId },
    data: { trashedAt: new Date() },
  });
}

export async function restoreDocument(userId: string, id: string): Promise<void> {
  await db.document.update({
    where: { id, userId },
    data: { trashedAt: null },
  });
}

export async function deleteDocument(userId: string, id: string): Promise<void> {
  const row = await db.document.findUniqueOrThrow({ where: { id, userId } });
  await del(row.pathname);
  await db.document.delete({ where: { id, userId } });
}
