'use client';

import { create } from 'zustand';

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

interface ConnectivityState {
  online: boolean;
  syncState: SyncState;
  pendingCount: number;
  setOnline: (online: boolean) => void;
  setSyncState: (state: SyncState) => void;
  setPendingCount: (count: number) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncState: 'idle',
  pendingCount: 0,
  setOnline: (online) => set({ online }),
  setSyncState: (syncState) => set({ syncState }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));

export function initConnectivityListeners() {
  if (typeof window === 'undefined') return;

  const { setOnline, setSyncState } = useConnectivityStore.getState();

  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => {
    setOnline(false);
    setSyncState('offline');
  });

  // Listen for SW flush requests
  navigator.serviceWorker?.addEventListener('message', (event) => {
    if (event.data?.type === 'FLUSH_OUTBOX') {
      window.dispatchEvent(new CustomEvent('sync:flush'));
    }
  });
}
