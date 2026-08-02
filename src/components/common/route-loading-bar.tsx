'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { useRouteLoader } from '@/providers/route-loader-provider';

export function RouteLoadingBar() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const { phase, progress, start } = useRouteLoader();

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      start(pathname);
    }
  }, [pathname, start]);

  if (phase === 'idle') return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 8px oklch(var(--primary) / 0.4)',
        }}
      />
    </div>
  );
}
