'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

import { LifeIcon } from '@/components/common/logo';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { footerNav, mainNavGroups, type NavItem } from '@/constants/navigation';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

function NavItemLink({
  href,
  icon: Icon,
  title,
  collapsed,
}: {
  href: string;
  icon: NavItem['icon'];
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
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            active
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
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
  const visible = useAppStore((state) => state.sidebarVisible);

  if (!visible) return null;

  return (
    <aside
      className={cn(
        'bg-muted/40 relative sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 md:flex',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      <div
        className={cn('flex h-14 items-center border-b px-3', collapsed && 'justify-center px-0')}
      >
        <Link
          href="/dashboard"
          aria-label="LifeOS home"
          className={cn('flex items-center gap-2 font-semibold', collapsed && 'justify-center')}
        >
          <LifeIcon className="size-8" />
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

      {collapsed && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          className="absolute top-1/2 -right-3 z-10 size-6 -translate-y-1/2 rounded-full bg-background shadow-md"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      )}

      <div className="no-scrollbar overflow-y-auto flex-1">
        <nav className="flex flex-col gap-1 p-2" aria-label="Primary">
          {mainNavGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-muted-foreground/70 mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider first:mt-2">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <NavItemLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  collapsed={collapsed}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

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
