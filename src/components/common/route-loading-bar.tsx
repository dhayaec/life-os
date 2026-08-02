'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Phase = 'idle' | 'starting' | 'loading' | 'completing';

export function RouteLoadingBar() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [state, setState] = useState<{ phase: Phase; progress: number }>({
    phase: 'idle',
    progress: 0,
  });

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      timers.current.forEach(clearTimeout);
      timers.current = [];

      setState({ phase: 'starting', progress: 0 });

      timers.current.push(
        setTimeout(() => setState({ phase: 'loading', progress: 30 }), 100),
        setTimeout(() => setState({ phase: 'loading', progress: 60 }), 400),
        setTimeout(() => setState({ phase: 'loading', progress: 80 }), 800),
        setTimeout(() => setState({ phase: 'completing', progress: 100 }), 1200)
      );
    }
  }, [pathname]);

  useEffect(() => {
    if (state.phase !== 'completing') return;
    const t = setTimeout(() => setState({ phase: 'idle', progress: 0 }), 200);
    return () => clearTimeout(t);
  }, [state.phase]);

  if (state.phase === 'idle') return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${state.progress}%`,
          boxShadow: '0 0 8px oklch(var(--primary) / 0.4)',
        }}
      />
    </div>
  );
}
