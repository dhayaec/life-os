// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import type { Domain, SyncOpEnvelope } from '@/lib/sync/types';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

async function freshStore() {
  const { store } = await import('@/lib/sync/db');
  return store;
}

async function freshApplyLocal() {
  const { applyLocal } = await import('@/lib/sync/local-appliers');
  return applyLocal;
}

function op(domain: Domain, opType: SyncOpEnvelope['opType'], payload: Record<string, unknown>) {
  return {
    opId: 'op-1',
    clientId: String(payload['id'] ?? ''),
    domain,
    opType,
    payload,
    createdAt: '2026-01-01T00:00:00.000Z',
  } as SyncOpEnvelope;
}

// applyLocal is a pure reducer — it returns { put } or { deleteId } and the
// engine writes to the store. Tests only assert on return values, never store state.

describe('applyLocal', () => {
  it('create returns the full payload for storage', async () => {
    const applyLocal = await freshApplyLocal();
    const payload = {
      id: 't1',
      title: 'Buy milk',
      done: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const result = await applyLocal('tasks', op('tasks', 'create', payload));
    expect(result).toEqual({ put: payload });
  });

  it('update merges into the existing row, keeping untouched fields', async () => {
    const store = await freshStore();
    const applyLocal = await freshApplyLocal();
    await store.put('tasks', {
      id: 't1',
      title: 'Buy milk',
      done: false,
      note: '2L',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await applyLocal(
      'tasks',
      op('tasks', 'update', { id: 't1', done: true, updatedAt: '2026-01-01T01:00:00.000Z' })
    );
    expect(result.put).toMatchObject({ id: 't1', title: 'Buy milk', done: true, note: '2L' });
  });

  it('update onto a missing row still produces the merged row', async () => {
    const applyLocal = await freshApplyLocal();
    const result = await applyLocal(
      'tasks',
      op('tasks', 'update', { id: 'ghost', name: 'x', updatedAt: '2026-01-01T00:00:00.000Z' })
    );
    expect(result.put).toEqual({ id: 'ghost', name: 'x', updatedAt: '2026-01-01T00:00:00.000Z' });
  });

  it('update derives label rows from labelNames for optimistic UI', async () => {
    const applyLocal = await freshApplyLocal();
    const result = await applyLocal(
      'tasks',
      op('tasks', 'update', {
        id: 't1',
        labelNames: ['Home', 'Work'],
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    );
    expect(result.put?.['labels']).toEqual([
      { id: 'Home', name: 'Home', color: '#64748b' },
      { id: 'Work', name: 'Work', color: '#64748b' },
    ]);
  });

  it('update keeps a null marker instead of dropping it (cleared dueAt)', async () => {
    const store = await freshStore();
    const applyLocal = await freshApplyLocal();
    await store.put('tasks', {
      id: 't1',
      title: 'T',
      dueAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const result = await applyLocal(
      'tasks',
      op('tasks', 'update', { id: 't1', dueAt: null, updatedAt: '2026-01-02T00:00:00.000Z' })
    );
    expect(result.put?.['dueAt']).toBeNull();
  });

  it('delete returns the id to remove', async () => {
    const applyLocal = await freshApplyLocal();
    expect(await applyLocal('tasks', op('tasks', 'delete', { id: 't1' }))).toEqual({
      deleteId: 't1',
    });
  });
});
