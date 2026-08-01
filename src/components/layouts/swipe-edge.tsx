'use client';

import { useRef } from 'react';

import { useAppDispatch } from '@/store/redux/hooks';
import { setMobileNavOpen } from '@/store/redux/slices/ui-slice';

/**
 * Mobile-only gesture zone: a swipe starting from the left screen edge opens
 * the navigation drawer (Android-style side nav). The 20px strip is thin enough
 * that it doesn't block normal taps, and `touch-none` stops the browser from
 * hijacking the gesture for its own back-swipe handling.
 */
export function SwipeEdge() {
  const dispatch = useAppDispatch();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function reset() {
    startX.current = null;
    startY.current = null;
  }

  return (
    <div
      aria-hidden
      className="fixed inset-y-0 left-0 z-40 w-5 touch-none md:hidden"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        startX.current = touch.clientX;
        startY.current = touch.clientY;
      }}
      onTouchMove={(event) => {
        if (startX.current === null || startY.current === null) return;
        const touch = event.touches[0];
        if (!touch) return;
        const dx = touch.clientX - startX.current;
        const dy = touch.clientY - startY.current;
        if (dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          dispatch(setMobileNavOpen(true));
          reset();
        }
      }}
      onTouchEnd={reset}
      onTouchCancel={reset}
    />
  );
}
