'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Command, MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { allNav } from '@/constants/navigation';
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks';
import { setMobileNavOpen } from '@/store/redux/slices/ui-slice';
import { cn } from '@/lib/utils';

export function MobileSidebar() {
  const open = useAppSelector((state) => state.ui.mobileNavOpen);
  const dispatch = useAppDispatch();
  const pathname = usePathname();

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
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Command className="size-4" />
            </span>
            LifeOS
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {allNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => dispatch(setMobileNavOpen(false))}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
