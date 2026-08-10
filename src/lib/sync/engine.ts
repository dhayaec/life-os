'use client';

import { toast } from '@/components/ui/toast';

import { store } from './db';
import { applyLocal } from './local-appliers';
import { countByDomain, deleteByIds, enqueue as outboxEnqueue, list, listByRecord } from './outbox';
import { useConnectivityStore } from './connectivity-store';
import type {
  Domain,
  OpType,
  OutboxEntry,
  PullResponse,
  PushResponse,
  Row,
  SyncOpEnvelope,
  SyncOpResult,
} from './types';

const PUSH_CHUNK = 50;
const RETRY_DELAY_MS = 30_000;
const EPOCH = new Date(0).toISOString();
const BG_SYNC_TAG = 'flush-outbox';

let bgSyncReady: Promise<ServiceWorkerRegistration> | null = null;

// Request a Background Sync flush when an op is queued. Fire-and-forget: if the
// API is unavailable (desktop without the API, iOS) the visibilitychange and
// online-event listeners in `init()` cover the flush instead.
function requestBackgroundSync() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  bgSyncReady ??= navigator.serviceWorker.ready;
  bgSyncReady
    .then((reg) => {
      const sync = (reg as { sync?: { register: (tag: string) => Promise<void> } }).sync;
      if (sync) void sync.register(BG_SYNC_TAG);
    })
    .catch(() => {
      bgSyncReady = null;
    });
}

interface EngineState {
  initialized: boolean;
  watermark: string;
  pullInFlight: boolean;
  pushInFlight: boolean;
  stopped: boolean;
}

const state: EngineState = {
  initialized: false,
  watermark: EPOCH,
  pullInFlight: false,
  pushInFlight: false,
  stopped: false,
};

function isoCompare(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function maxIso(a: string, b: string): string {
  return isoCompare(a, b) >= 0 ? a : b;
}

function makeOpId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function conn() {
  return useConnectivityStore.getState();
}

async function refreshPendingCount() {
  conn().setPendingCount(await countByDomain());
}

async function advanceWatermark(iso: string) {
  state.watermark = maxIso(state.watermark, iso);
  await store.metaSet('watermark', state.watermark);
}

async function hasPendingFor(domain: Domain, recordId: string): Promise<boolean> {
  return (await listByRecord(domain, recordId)).length > 0;
}

function onFlush() {
  void pushOutbox();
}

function onVisibility() {
  if (document.visibilityState === 'visible') {
    void pushOutbox();
    void pull();
  }
}

export async function init(): Promise<void> {
  if (state.initialized) return;
  state.initialized = true;

  state.watermark = (await store.metaGet<string>('watermark')) ?? EPOCH;
  await refreshPendingCount();

  if (typeof window === 'undefined') return;

  window.addEventListener('sync:flush', onFlush);
  document.addEventListener('visibilitychange', onVisibility);

  useConnectivityStore.subscribe((next, prev) => {
    if (next.online && !prev.online) {
      conn().setSyncState('idle');
      state.stopped = false;
      void pushOutbox();
      void pull();
    }
  });

  const { online } = conn();
  if (online) void pull();
}

/** Optimistic apply + outbox + background push when online. Returns the op. */
export async function enqueue(op: {
  domain: Domain;
  opType: OpType;
  payload: Row;
}): Promise<SyncOpEnvelope> {
  void init();

  const entry: SyncOpEnvelope = {
    opId: makeOpId(),
    clientId: String(op.payload['id'] ?? ''),
    domain: op.domain,
    opType: op.opType,
    payload: op.payload,
    createdAt: new Date().toISOString(),
  };

  const result = await applyLocal(op.domain, entry);
  if (result.put) await store.put(op.domain, result.put);
  if (result.deleteId) await store.delete(op.domain, result.deleteId);

  await outboxEnqueue(entry);
  await refreshPendingCount();

  requestBackgroundSync();

  const { online, syncState } = conn();
  if (online && syncState !== 'error' && !state.stopped) void pushOutbox();

  return entry;
}

export async function pull(): Promise<void> {
  if (state.pullInFlight) return;
  state.pullInFlight = true;
  try {
    const { online, syncState } = conn();
    if (!online || syncState === 'offline' || state.stopped) return;

    const res = await fetch(`/api/sync/pull?after=${encodeURIComponent(state.watermark)}`);
    if (!res.ok) {
      if (res.status === 401) {
        state.stopped = true;
        conn().setSyncState('error');
        return;
      }
      conn().setSyncState('error');
      return;
    }
    const data = (await res.json()) as PullResponse;
    await reconcilePull(data);
    conn().setSyncState('idle');
  } finally {
    state.pullInFlight = false;
  }
}

export async function pushOutbox(): Promise<void> {
  if (state.pushInFlight) return;
  const { online, syncState } = conn();
  if (!online || syncState === 'offline' || state.stopped) return;

  state.pushInFlight = true;
  conn().setSyncState('syncing');
  try {
    let batch = await list();
    while (batch.length > 0) {
      const chunk = batch.slice(0, PUSH_CHUNK);
      let res: Response;
      try {
        res = await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ops: chunk }),
        });
      } catch {
        conn().setSyncState('error');
        return;
      }

      if (res.status === 401) {
        state.stopped = true;
        conn().setSyncState('error');
        return;
      }
      if (!res.ok) {
        conn().setSyncState('error');
        scheduleRetry();
        return;
      }

      const data = (await res.json()) as PushResponse;
      await reconcilePushResults(chunk, data.results);
      await advanceWatermark(data.after);

      batch = await list();
      if (batch.length > 0 && batch[0]?.failed) return;
    }
    conn().setSyncState('idle');
  } finally {
    state.pushInFlight = false;
  }
}

let retryTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRetry() {
  if (retryTimer) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (conn().online && !state.stopped) void pushOutbox();
  }, RETRY_DELAY_MS);
}

async function reconcilePushResults(batch: OutboxEntry[], results: SyncOpResult[]) {
  const done: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const op = batch[i];
    const result = results[i];
    if (!op || !result) continue;

    switch (result.status) {
      case 'applied':
      case 'duplicate':
        if (result.record) {
          await store.put(op.domain, result.record);
          await advanceWatermark(String(result.record['updatedAt'] ?? EPOCH));
        } else if (op.opType === 'create') {
          // Create never materialised server-side: remove the ghost row.
          await store.delete(op.domain, String(op.payload['id']));
        }
        break;
      case 'conflict':
        // Server won LWW: adopt the canonical record.
        if (result.record) {
          await store.put(op.domain, result.record);
          await advanceWatermark(String(result.record['updatedAt'] ?? EPOCH));
        }
        toast.message('This change was overwritten by a newer version from another device.');
        break;
      case 'error': {
        if (op.opType === 'create') {
          await store.delete(op.domain, String(op.payload['id']));
        }
        toast.error(result.error ?? 'This change could not be saved.');
        break;
      }
    }
    done.push(op.opId);
  }
  await deleteByIds(done);
  await refreshPendingCount();
}

async function reconcilePull(data: PullResponse) {
  for (const [domainName, domainData] of Object.entries(data.domains)) {
    const domain = domainName as Domain;
    const rows = domainData.rows ?? [];
    const deleted = domainData.deleted ?? [];

    for (const remote of rows) {
      if (await hasPendingFor(domain, String(remote['id']))) continue;
      const local = await store.get(domain, String(remote['id']));
      if (!local || isoCompare(String(remote['updatedAt']), String(local['updatedAt'])) >= 0) {
        await store.put(domain, remote);
      }
    }

    for (const id of deleted) {
      await store.delete(domain, id);
      const pending = await listByRecord(domain, id);
      await deleteByIds(pending.map((op) => op.opId));
    }
  }

  await advanceWatermark(data.after);
  await refreshPendingCount();
}

/** Seed local store from RSC props (LWW). Never overwrites a pending outbox row. */
export async function hydrateSeed(domain: Domain, rows: Row[]) {
  for (const remote of rows) {
    if (await hasPendingFor(domain, String(remote['id']))) continue;
    const local = await store.get(domain, String(remote['id']));
    if (!local || isoCompare(String(remote['updatedAt']), String(local['updatedAt'])) >= 0) {
      await store.put(domain, remote);
    }
  }
}

export const syncEngine = { init, enqueue, pull, pushOutbox, hydrateSeed };
