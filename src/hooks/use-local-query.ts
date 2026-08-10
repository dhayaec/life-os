'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { getStoreVersion, store, subscribeStore, type Row } from '@/lib/sync/db';
import type { Domain } from '@/lib/sync/types';

/**
 * Reactive store-backed read. Renders `{ rows: null }` (shimmer) until the first
 * IDB read resolves, then re-reads on every local/remote store mutation.
 *
 * `deps` must list the values the selector closes over; it is the caller's
 * contract that the selector only changes meaning when those change.
 */
export function useLocalQuery<T extends Row>(
  domain: Domain,
  selector?: (rows: T[]) => T[],
  deps: unknown[] = []
) {
  const version = useSyncExternalStore(subscribeStore, getStoreVersion, getStoreVersion);
  const [rows, setRows] = useState<T[] | null>(null);
  const selectorRef = useRef(selector);

  useEffect(() => {
    selectorRef.current = selector;
  });

  useEffect(() => {
    let alive = true;
    store.getAll<T>(domain).then((all) => {
      if (!alive) return;
      const select = selectorRef.current;
      setRows(select ? select(all) : all);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, domain, ...deps]);

  return { rows, hydrated: rows !== null };
}
