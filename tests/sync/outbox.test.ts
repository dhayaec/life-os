// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import type { SyncOpEnvelope } from '@/lib/sync/types';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

async function fresh() {
  const outbox = await import('@/lib/sync/outbox');
  return outbox;
}

function envelope(
  id: string,
  opType: SyncOpEnvelope['opType'],
  overrides: Partial<SyncOpEnvelope> = {}
) {
  return {
    opId: `op-${id}`,
    clientId: id,
    domain: overrides.domain ?? 'tasks',
    opType,
    payload: { id, updatedAt: '2026-01-01T00:00:00.000Z' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as SyncOpEnvelope;
}

describe('outbox', () => {
  it('enqueue + list round-trips', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'create'));
    const ops = await outbox.list();
    expect(ops).toHaveLength(1);
    expect(ops[0]?.opId).toBe('op-t1');
  });

  it('coalesces repeated updates to the same record', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'update', { domain: 'tasks' }));
    await outbox.enqueue(
      envelope('t1', 'update', {
        domain: 'tasks',
        payload: { id: 't1', done: true, updatedAt: '2026-01-01T00:00:00.000Z' },
      })
    );
    const ops = await outbox.list();
    expect(ops).toHaveLength(1);
    expect(ops[0]?.payload['done']).toBe(true);
  });

  it('delete supersedes a pending create for the same record', async () => {
    const outbox = await fresh();
    await outbox.enqueue(
      envelope('t1', 'create', {
        domain: 'tasks',
        payload: { id: 't1', name: 'new', updatedAt: '2026-01-01T00:00:00.000Z' },
      })
    );
    await outbox.enqueue(envelope('t1', 'delete', { domain: 'tasks' }));
    const ops = await outbox.list();
    expect(ops).toHaveLength(1);
    expect(ops[0]?.opType).toBe('delete');
  });

  it('listByRecord returns only matching ops', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'create', { domain: 'tasks' }));
    await outbox.enqueue(envelope('t2', 'create', { domain: 'tasks' }));
    await outbox.enqueue(envelope('t1', 'update', { domain: 'notes' }));

    expect(await outbox.listByRecord('tasks', 't1')).toHaveLength(1);
    expect(await outbox.listByRecord('tasks', 't2')).toHaveLength(1);
    expect(await outbox.listByRecord('notes', 't1')).toHaveLength(1);
    expect(await outbox.listByRecord('tasks', 'ghost')).toHaveLength(0);
  });

  it('deleteByIds removes ops from both cache and IDB', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'create'));
    await outbox.enqueue(envelope('t2', 'update'));
    await outbox.deleteByIds(['op-t1']);
    const ops = await outbox.list();
    expect(ops).toHaveLength(1);
    expect(ops[0]?.opId).toBe('op-t2');

    // Re-import to verify IDB was mutated
    const outbox2 = await fresh();
    const ops2 = await outbox2.list();
    expect(ops2).toHaveLength(1);
    expect(ops2[0]?.opId).toBe('op-t2');
  });

  it('countByDomain returns total pending across domains', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'create', { domain: 'tasks' }));
    await outbox.enqueue(envelope('t1', 'create', { domain: 'notes' }));
    expect(await outbox.countByDomain()).toBe(2);
  });

  it('markFailed sets the failed flag and increments attempts', async () => {
    const outbox = await fresh();
    await outbox.enqueue(envelope('t1', 'create', { domain: 'tasks' }));
    await outbox.markFailed('op-t1');

    const ops = await outbox.list();
    expect(ops[0]?.failed).toBe(true);
    expect(ops[0]?.attempts).toBe(1);
  });
});
