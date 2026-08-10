'use client';

const SW_URL = '/sw.js';

export function registerSW() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (!window.isSecureContext && location.hostname !== 'localhost') return;

  navigator.serviceWorker.register(SW_URL).catch(() => {
    // SW registration failed — non-critical, app still works online
  });
}
