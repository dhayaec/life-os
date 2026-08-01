import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  del: vi.fn(async () => {}),
  getDownloadUrl: vi.fn((pathname: string) => `signed:${pathname}`),
  findMany: vi.fn(),
  create: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@vercel/blob', () => ({
  del: mocks.del,
  getDownloadUrl: mocks.getDownloadUrl,
}));

vi.mock('@/server/db', () => ({
  db: { document: mocks },
}));

import {
  createDocument,
  deleteDocument,
  getDocuments,
  restoreDocument,
  toggleDocumentFavorite,
  trashDocument,
} from '@/features/documents/services/documents-service';

const row = {
  id: 'doc-1',
  name: 'readme.txt',
  type: 'text/plain',
  size: 1024,
  url: 'https://blob/readme.txt',
  pathname: 'user-1/readme.txt',
  isFavorite: false,
  trashedAt: null as Date | null,
  createdAt: new Date('2026-08-01T00:00:00Z'),
};

describe('documents-service', () => {
  afterEach(() => vi.clearAllMocks());

  it('lists active documents with a signed download URL', async () => {
    mocks.findMany.mockResolvedValue([row]);
    const items = await getDocuments('user-1');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      name: 'readme.txt',
      trashedAt: null,
      downloadUrl: 'signed:user-1/readme.txt',
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', trashedAt: null } })
    );
  });

  it('filters to trashed documents when requested', async () => {
    mocks.findMany.mockResolvedValue([{ ...row, trashedAt: new Date() }]);
    await getDocuments('user-1', { trashed: true });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', trashedAt: { not: null } } })
    );
  });

  it('creates a document record for an upload', async () => {
    await createDocument('user-1', {
      name: 'a.txt',
      type: 'text/plain',
      size: 5,
      url: 'https://x/a',
      pathname: 'user-1/a',
    });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'a.txt', userId: 'user-1' }),
      })
    );
  });

  it('toggles favorite off when currently favorited', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...row, isFavorite: true });
    await toggleDocumentFavorite('user-1', 'doc-1');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1', userId: 'user-1' },
        data: { isFavorite: false },
      })
    );
  });

  it('trashes and restores a document', async () => {
    await trashDocument('user-1', 'doc-1');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trashedAt: expect.any(Date) } })
    );

    mocks.update.mockClear();
    await restoreDocument('user-1', 'doc-1');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { trashedAt: null } })
    );
  });

  it('deletes the blob before the database record', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue(row);
    await deleteDocument('user-1', 'doc-1');
    expect(mocks.del).toHaveBeenCalledWith('user-1/readme.txt');
    expect(mocks.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'doc-1', userId: 'user-1' } })
    );
  });
});
