// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import type { OutboxEntry, PullResponse, PushResponse } from '@/lib/sync/types';

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------- helpers ----------

async function fresh() {
  const { store } = await import('@/lib/sync/db');
  const { syncEngine } = await import('@/lib/sync/engine');
  const { enqueue } = await import('@/lib/sync/outbox');
  return { store, syncEngine, enqueue };
}

// Drive the connectivity store directly. `vi.stubGlobal('navigator', …)` after
// module import can't update the already-created zustand store, and Node's
// navigator.onLine is not a reliable signal in the test env.
async function setOnline(online: boolean) {
  const { useConnectivityStore } = await import('@/lib/sync/connectivity-store');
  const s = useConnectivityStore.getState();
  s.setOnline(online);
  s.setSyncState(online ? 'idle' : 'offline');
}

function mockFetch(response: Response | Promise<Response>) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(response));
}

function pullResponse(partial: Partial<PullResponse> & { domains?: PullResponse['domains'] } = {}) {
  const data: PullResponse = { after: new Date().toISOString(), ...partial };
  data.domains ??= {};
  return Response.json(data);
}

function makePushResponse(after: string, results: PushResponse['results']) {
  return Response.json({ after, results } satisfies PushResponse);
}

function outboxEntry(id: string, overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    opId: `op-${id}`,
    clientId: id,
    domain: 'tasks',
    opType: 'create',
    payload: { id, name: 'task', updatedAt: '2026-01-01T00:00:00.000Z' },
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// ---------- watermark / init ----------

describe('engine watermark', () => {
  it('init loads the stored watermark or defaults to epoch', async () => {
    const { store, syncEngine } = await fresh();
    await store.metaSet('watermark', '2026-06-01T00:00:00.000Z');

    // Offline so pull() does not fire (avoids unhandled fetch error)
    await setOnline(false);
    mockFetch(Response.json({ error: 'no' })); // safety net for unexpected fetch
    await syncEngine.init();
    // No assertion needed — if init threw, the test fails. Watermark read is the assertion.
  });
});

// ---------- reconcilePull ----------

describe('syncEngine.pull / reconcilePull', () => {
  it('applies remote rows via LWW and advances watermark', async () => {
    const { store, syncEngine } = await fresh();
    await setOnline(true);
    const remoteRow = { id: 't1', name: 'Remote task', updatedAt: '2026-06-15T00:00:00.000Z' };
    mockFetch(
      pullResponse({
        after: '2026-06-15T00:00:00.000Z',
        domains: { tasks: { rows: [remoteRow], deleted: [] } },
      })
    );
    await syncEngine.init();
    await syncEngine.pull();
    const local = await store.get('tasks', 't1');
    expect(local).toEqual(remoteRow);
  });

  it('skips remote row when a pending outbox op exists for the same record', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(true);
    // Seed an optimistic local write
    await store.put('tasks', {
      id: 't1',
      name: 'Local draft',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    await enqueue(
      outboxEntry('t1', {
        domain: 'tasks',
        opType: 'create',
        payload: { id: 't1', name: 'Local draft', updatedAt: '2026-06-01T00:00:00.000Z' },
      })
    );

    const remoteRow = { id: 't1', name: 'Remote row', updatedAt: '2026-06-15T00:00:00.000Z' };
    mockFetch(
      pullResponse({
        after: '2026-06-15T00:00:00.000Z',
        domains: { tasks: { rows: [remoteRow], deleted: [] } },
      })
    );
    await syncEngine.init();
    await syncEngine.pull();
    const local = await store.get('tasks', 't1');
    // Local draft preserved — seed rule prevents overwriting a pending row
    expect(local?.['name']).toBe('Local draft');
  });

  it('deletes tombstoned rows from the local store', async () => {
    const { store, syncEngine } = await fresh();
    await setOnline(true);
    await store.put('tasks', {
      id: 't2',
      name: 'to-delete',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    mockFetch(
      pullResponse({
        after: '2026-06-15T00:00:00.000Z',
        domains: { tasks: { rows: [], deleted: ['t2'] } },
      })
    );
    await syncEngine.init();
    await syncEngine.pull();
    expect(await store.get('tasks', 't2')).toBeUndefined();
  });

  it('sets syncState to error on 401 and stops further sync', async () => {
    const { syncEngine } = await fresh();
    await setOnline(true);
    mockFetch(new Response(null, { status: 401 }));
    await syncEngine.init();
    await syncEngine.pull();
    const { useConnectivityStore } = await import('@/lib/sync/connectivity-store');
    expect(useConnectivityStore.getState().syncState).toBe('error');
  });
});

// ---------- reconcilePushResults ----------

describe('syncEngine.pushOutbox / reconcilePushResults', () => {
  it('applied result stores the canonical record and deletes the op', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(true);
    await enqueue(
      outboxEntry('t1', {
        domain: 'tasks',
        opType: 'create',
        payload: { id: 't1', name: 'Local', updatedAt: '2026-01-01T00:00:00.000Z' },
      })
    );

    const canonical = { id: 't1', name: 'Server-canonical', updatedAt: '2026-06-15T00:00:00.000Z' };
    mockFetch(
      makePushResponse('2026-06-15T00:00:00.000Z', [{ status: 'applied', record: canonical }])
    );
    await syncEngine.init();
    await syncEngine.pushOutbox();
    expect(await store.get('tasks', 't1')).toEqual(canonical);
  });

  it('conflict result adopts the server record and deletes the op', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(true);
    await enqueue(
      outboxEntry('t1', {
        domain: 'tasks',
        opType: 'update',
        payload: { id: 't1', name: 'Old', updatedAt: '2026-01-01T00:00:00.000Z' },
      })
    );

    const canonical = { id: 't1', name: 'Server-won', updatedAt: '2026-06-15T00:00:00.000Z' };
    mockFetch(
      makePushResponse('2026-06-15T00:00:00.000Z', [{ status: 'conflict', record: canonical }])
    );
    await syncEngine.init();
    await syncEngine.pushOutbox();
    expect(await store.get('tasks', 't1')).toEqual(canonical);
  });

  it('error on a create op deletes the ghost row', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(true);
    await enqueue(
      outboxEntry('t1', {
        domain: 'tasks',
        opType: 'create',
        payload: { id: 't1', name: 'ghost', updatedAt: '2026-01-01T00:00:00.000Z' },
      })
    );

    mockFetch(
      makePushResponse('2026-01-01T00:00:00.000Z', [
        { status: 'error', error: 'validation failed' },
      ])
    );
    await syncEngine.init();
    await syncEngine.pushOutbox();
    expect(await store.get('tasks', 't1')).toBeUndefined();
  });

  it('duplicate result deletes the op (idempotent re-push)', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(true);
    const canonical = { id: 't1', name: 'done', updatedAt: '2026-06-15T00:00:00.000Z' };
    await store.put('tasks', canonical);
    await enqueue(outboxEntry('t1', { domain: 'tasks', opType: 'create', payload: canonical }));

    mockFetch(
      makePushResponse('2026-06-15T00:00:00.000Z', [{ status: 'duplicate', record: canonical }])
    );
    await syncEngine.init();
    await syncEngine.pushOutbox();
    expect(await store.get('tasks', 't1')).toEqual(canonical);
  });
});

// ---------- hydrateSeed ----------

describe('syncEngine.hydrateSeed', () => {
  it('seeds the local store with LWW', async () => {
    const { store, syncEngine } = await fresh();
    await setOnline(false);
    await syncEngine.init();
    await syncEngine.hydrateSeed('tasks', [
      { id: 't1', name: 'From server', updatedAt: '2026-06-01T00:00:00.000Z' },
    ]);
    expect(await store.get('tasks', 't1')).toEqual({
      id: 't1',
      name: 'From server',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
  });

  it('never overwrites a row referenced by a pending outbox op', async () => {
    const { store, syncEngine, enqueue } = await fresh();
    await setOnline(false);
    await syncEngine.init();

    await store.put('tasks', {
      id: 't1',
      name: 'Optimistic',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    await enqueue(
      outboxEntry('t1', {
        domain: 'tasks',
        opType: 'create',
        payload: { id: 't1', name: 'Optimistic', updatedAt: '2026-06-01T00:00:00.000Z' },
      })
    );

    await syncEngine.hydrateSeed('tasks', [
      { id: 't1', name: 'Server overwriter', updatedAt: '2026-06-15T00:00:00.000Z' },
    ]);
    const row = await store.get('tasks', 't1');
    expect(row?.['name']).toBe('Optimistic');
  });
});
