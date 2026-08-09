'use client';

import { useEffect } from 'react';

// The viewport meta (user-scalable=no) is ignored by iOS Safari in a normal
// browser tab, so this blocks the remaining pinch/zoom paths in JS. Only
// multi-touch and modifier gestures are stopped, so single-finger scroll and
// the SwipeEdge drawer gesture are unaffected.
export function ZoomBlocker() {
  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    document.addEventListener('gesturestart', prevent);
    document.addEventListener('gesturechange', prevent);
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', prevent);
      document.removeEventListener('gesturechange', prevent);
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return null;
}
