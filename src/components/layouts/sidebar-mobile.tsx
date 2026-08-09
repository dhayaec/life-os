'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuIcon } from 'lucide-react';
import { useEffect } from 'react';

import { LifeIcon } from '@/components/common/logo';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { footerNav, mainNavGroups } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks';
import { setMobileNavOpen } from '@/store/redux/slices/ui-slice';
import { cn } from '@/lib/utils';

export function MobileSidebar() {
  const open = useAppSelector((state) => state.ui.mobileNavOpen);
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  // Android back button closes the open drawer first. A history entry is
  // pushed while open so the back press lands on `popstate` instead of
  // leaving the app; leftover entries from overlay/link closes are consumed
  // harmlessly on later back presses.
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ mobileNavOpen: true }, '');
    const handlePopState = () => dispatch(setMobileNavOpen(false));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open, dispatch]);

  return (
    <Sheet open={open} onOpenChange={(next) => dispatch(setMobileNavOpen(next))}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <MenuIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <LifeIcon className="size-8" />
            LifeOS
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {mainNavGroups.map((group) => (
            <div key={group.label}>
              <p className="text-muted-foreground/70 mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider first:mt-2">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => dispatch(setMobileNavOpen(false))}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="mt-2 border-t pt-2">
            {footerNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => dispatch(setMobileNavOpen(false))}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
