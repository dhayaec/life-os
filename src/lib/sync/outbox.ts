'use client';

import { store } from './db';
import type { Domain, OutboxEntry, SyncOpEnvelope } from './types';

// Module-level cache of pending ops, refreshed lazily. Keeps coalescing + pending
// lookups fast without an IDB round-trip per enqueue.
let pendingOps: Partial<Record<Domain, OutboxEntry[]>> = {};
let loaded = false;

async function load() {
  if (loaded) return;
  const all = await store.outboxGetAll();
  pendingOps = {};
  for (const entry of all) {
    (pendingOps[entry.domain] ??= []).push(entry);
  }
  loaded = true;
}

export async function enqueue(entry: SyncOpEnvelope): Promise<void> {
  await load();
  const domainOps = (pendingOps[entry.domain] ??= []);

  let merged: SyncOpEnvelope = entry;
  if (entry.opType !== 'delete') {
    // Coalesce repeated edits to the same record into one op (keeps batches
    // one-op-per-record, which sidesteps within-batch LWW ordering issues).
    const existing = domainOps.find(
      (op) => op.payload['id'] === entry.payload['id'] && op.opType !== 'delete'
    );
    if (existing) {
      merged = {
        ...existing,
        payload: { ...existing.payload, ...entry.payload },
        createdAt: entry.createdAt,
      };
    }
  }

  const index = domainOps.findIndex((op) => op.opId === merged.opId);
  if (index >= 0) domainOps[index] = merged;
  else domainOps.push(merged);

  const stale: string[] = [];
  if (entry.opType === 'delete') {
    // A delete supersedes any pending create/update for the same record.
    for (const op of domainOps) {
      if (op.payload['id'] === entry.payload['id'] && op.opType !== 'delete') stale.push(op.opId);
    }
    pendingOps[entry.domain] = domainOps.filter((op) => !stale.includes(op.opId));
  }

  await store.outboxAdd(merged);
  await store.outboxDelete(stale);
}

export async function list(domain?: Domain): Promise<OutboxEntry[]> {
  await load();
  if (domain) return pendingOps[domain] ?? [];
  return Object.values(pendingOps).flat();
}

export async function listByRecord(domain: Domain, recordId: string): Promise<OutboxEntry[]> {
  return (await list(domain)).filter((op) => op.payload['id'] === recordId);
}

export async function deleteByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const set = new Set(ids);
  for (const domain of Object.keys(pendingOps) as Domain[]) {
    pendingOps[domain] = (pendingOps[domain] ?? []).filter((op) => !set.has(op.opId));
  }
  await store.outboxDelete(ids);
}

export async function countByDomain(): Promise<number> {
  await load();
  return Object.values(pendingOps).reduce((sum, ops) => sum + ops.length, 0);
}

export async function countFor(domain: Domain): Promise<number> {
  await load();
  return (pendingOps[domain] ?? []).length;
}

export async function markFailed(opId: string): Promise<void> {
  await load();
  const entry = (await store.outboxGetAll()).find((op) => op.opId === opId);
  if (entry) {
    const failed = { ...entry, failed: true, attempts: (entry.attempts ?? 0) + 1 };
    const domainOps = pendingOps[entry.domain] ?? [];
    const index = domainOps.findIndex((op) => op.opId === opId);
    if (index >= 0) domainOps[index] = failed;
    pendingOps[entry.domain] = domainOps;
    await store.outboxPut(failed);
  }
}

export function invalidateCache() {
  loaded = false;
  pendingOps = {};
}
