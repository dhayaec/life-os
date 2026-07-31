'use client';

import { Bell, Search } from 'lucide-react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/redux/hooks';
import { setCommandPaletteOpen } from '@/store/redux/slices/ui-slice';
import { MobileSidebar } from './sidebar-mobile';

export function Topbar() {
  const dispatch = useAppDispatch();

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
      <MobileSidebar />
      <button
        type="button"
        onClick={() => dispatch(setCommandPaletteOpen(true))}
        className="group flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-accent"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <ThemeToggle />
        <div className="bg-primary text-primary-foreground ml-2 flex size-8 items-center justify-center rounded-full text-xs font-semibold">
          U
        </div>
      </div>
    </header>
  );
}
