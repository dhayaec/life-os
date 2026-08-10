'use client';

import { useEffect, useRef } from 'react';

import { toast } from '@/components/ui/toast';
import { useConnectivityStore } from '@/lib/sync/connectivity-store';

/**
 * Surfaces sync state as toasts on transitions instead of a persistent top
 * banner. Offline and error states stay until resolved; reconnection and the
 * drained-pending case show a transient confirmation.
 */
export function SyncToasts() {
  const offlineToastId = useRef<string | null>(null);
  const errorToastId = useRef<string | null>(null);

  useEffect(() => {
    const { online } = useConnectivityStore.getState();
    if (!online) {
      offlineToastId.current = toast.info(
        "You're offline — changes will sync when you're back online.",
        { persistent: true }
      );
    }

    return useConnectivityStore.subscribe((next, prev) => {
      // Went offline.
      if (!next.online && prev.online) {
        offlineToastId.current = toast.info(
          "You're offline — changes will sync when you're back online.",
          { persistent: true }
        );
      }

      // Came back online: clear the offline notice and confirm reconnection.
      if (next.online && !prev.online) {
        if (offlineToastId.current) toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;
        toast.success(
          prev.pendingCount > 0
            ? `Back online — ${prev.pendingCount} change${prev.pendingCount !== 1 ? 's' : ''} synced.`
            : 'Back online.'
        );
      }

      // Sync failed while online.
      if (next.syncState === 'error' && prev.syncState !== 'error' && next.online) {
        errorToastId.current = toast.error('Sync failed — will retry shortly.', {
          persistent: true,
        });
      }

      // Sync recovered.
      if (next.syncState !== 'error' && prev.syncState === 'error') {
        if (errorToastId.current) toast.dismiss(errorToastId.current);
        errorToastId.current = null;
      }
    });
  }, []);

  return null;
}
