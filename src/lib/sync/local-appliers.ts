'use client';

import { store } from './db';
import type { Domain, SyncOpEnvelope } from './types';

export interface LocalApplyResult {
  put?: Record<string, unknown>;
  deleteId?: string;
}

/** Derive displayable label rows from a labelNames array for optimistic UI. */
function labelsFromNames(
  names?: unknown
): { id: string; name: string; color: string }[] | undefined {
  if (!Array.isArray(names)) return undefined;
  return names.map((name) => ({
    id: String(name),
    name: String(name),
    color: '#64748b',
  }));
}

/**
 * Apply an op to the local store optimistically. `update` merges the payload into
 * the existing row; `create` inserts the full record; `delete` removes it. Domain
 * quirks (e.g. labels derived from labelNames) are folded into the merged row.
 */
export async function applyLocal(domain: Domain, op: SyncOpEnvelope): Promise<LocalApplyResult> {
  switch (op.opType) {
    case 'delete':
      return { deleteId: String(op.payload['id']) };
    case 'create':
      return { put: op.payload };
    case 'update': {
      const existing = await store.get(domain, String(op.payload['id']));
      const merged: Record<string, unknown> = { ...(existing ?? {}), ...op.payload };

      if (Array.isArray(op.payload['labelNames'])) {
        const labels = labelsFromNames(op.payload['labelNames']);
        if (labels) merged['labels'] = labels;
      }

      // A `null` status marker (e.g. cleared dueAt) must overwrite, not be dropped.
      return { put: merged };
    }
  }
}
