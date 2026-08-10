'use client';

import { useCallback } from 'react';

import { syncEngine } from '@/lib/sync/engine';
import { useConnectivityStore } from '@/lib/sync/connectivity-store';
import type { Domain, OpType, Row } from '@/lib/sync/types';

/**
 * Unified write path: optimistic local apply + outbox + background push.
 * Works identically online and offline.
 */
export function useSyncMutation(domain: Domain) {
  const online = useConnectivityStore((s) => s.online);
  const syncState = useConnectivityStore((s) => s.syncState);

  const enqueue = useCallback(
    (opType: OpType, payload: Row) => syncEngine.enqueue({ domain, opType, payload }),
    [domain]
  );

  return { enqueue, online, syncState };
}
