'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

type Phase = 'idle' | 'loading' | 'completing';

type RouteLoaderValue = {
  phase: Phase;
  progress: number;
  start: (pathname: string) => void;
  done: (pathname: string) => void;
};

const RouteLoaderContext = createContext<RouteLoaderValue | null>(null);

export function RouteLoaderProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  // The pathname the in-flight bar was started for. `done()` only completes a
  // matching navigation so a signal from a stale/mounted-early view can't cut
  // a newer navigation short.
  const activePathname = useRef<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const complete = useCallback(() => {
    clearTimers();
    setPhase('completing');
    setProgress(100);
    timers.current.push(
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 250)
    );
  }, [clearTimers]);

  const start = useCallback(
    (pathname: string) => {
      activePathname.current = pathname;
      clearTimers();
      setPhase('loading');
      setProgress(0);
      timers.current.push(
        setTimeout(() => setProgress(30), 150),
        setTimeout(() => setProgress(60), 450),
        setTimeout(() => setProgress(85), 900),
        // Safety net: never leave the bar stuck if a page has no component
        // that reports ready. The real completion comes from `done()`.
        setTimeout(() => {
          if (activePathname.current === pathname) {
            activePathname.current = null;
            complete();
          }
        }, 6000)
      );
    },
    [clearTimers, complete]
  );

  const done = useCallback(
    (pathname: string) => {
      if (activePathname.current !== pathname) return;
      activePathname.current = null;
      complete();
    },
    [complete]
  );

  return (
    <RouteLoaderContext.Provider value={{ phase, progress, start, done }}>
      {children}
    </RouteLoaderContext.Provider>
  );
}

export function useRouteLoader() {
  const ctx = useContext(RouteLoaderContext);
  if (!ctx) {
    throw new Error('useRouteLoader must be used within RouteLoaderProvider');
  }
  return ctx;
}

/**
 * Call from a page's data-backed client component. The bar completes when the
 * component mounts — i.e. once the page's server data has loaded and rendered.
 */
export function useRouteLoadedSignal() {
  const { done } = useRouteLoader();
  const pathname = usePathname();
  useEffect(() => {
    done(pathname);
  }, [done, pathname]);
}
