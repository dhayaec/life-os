'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, Command } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { footerNav, mainNav } from '@/constants/navigation';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

function NavItemLink({
  href,
  icon: Icon,
  title,
  collapsed,
}: {
  href: string;
  icon: (typeof mainNav)[number]['icon'];
  title: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span>{title}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{title}</TooltipContent>}
    </Tooltip>
  );
}

export function Sidebar() {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        'bg-muted/40 sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 md:flex',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      <div
        className={cn('flex h-14 items-center border-b px-3', collapsed && 'justify-center px-0')}
      >
        <Link
          href="/dashboard"
          className={cn('flex items-center gap-2 font-semibold', collapsed && 'justify-center')}
        >
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Command className="size-4" />
          </span>
          {!collapsed && <span className="tracking-tight">LifeOS</span>}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="ml-auto"
          >
            <ChevronsLeft className="size-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {mainNav.map((item) => (
            <NavItemLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              title={item.title}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      <div className="flex flex-col gap-1 border-t p-2">
        {footerNav.map((item) => (
          <NavItemLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            title={item.title}
            collapsed={collapsed}
          />
        ))}
      </div>
    </aside>
  );
}
