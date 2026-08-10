'use client';

import { useConnectivityStore } from '@/lib/sync/connectivity-store';

export function OfflineBanner() {
  const online = useConnectivityStore((s) => s.online);
  const pendingCount = useConnectivityStore((s) => s.pendingCount);
  const syncState = useConnectivityStore((s) => s.syncState);

  if (online && syncState !== 'error' && pendingCount === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-300 backdrop-blur-sm">
      {!online ? (
        <span>
          You&apos;re offline — changes will sync when you&apos;re back online.
          {pendingCount > 0 && ` ${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`}
        </span>
      ) : syncState === 'error' ? (
        <span>Sync failed — will retry shortly.</span>
      ) : pendingCount > 0 ? (
        <span>
          Syncing… {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
        </span>
      ) : null}
    </div>
  );
}
