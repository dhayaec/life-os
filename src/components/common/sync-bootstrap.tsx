'use client';

import { useEffect } from 'react';
import { registerSW } from '@/lib/sync/register-sw';
import { initConnectivityListeners } from '@/lib/sync/connectivity-store';
import { syncEngine } from '@/lib/sync/engine';

export function SyncBootstrap() {
  useEffect(() => {
    registerSW();
    initConnectivityListeners();
    void syncEngine.init();
  }, []);

  return null;
}
