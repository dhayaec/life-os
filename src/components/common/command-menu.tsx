'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  CalendarDays,
  Flame,
  ListTodo,
  NotebookPen,
  StickyNote,
  type LucideIcon,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { allNav } from '@/constants/navigation';
import { globalSearchAction } from '@/features/search/actions';
import type { SearchHit } from '@/features/search/services/search-service';
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks';
import { setCommandPaletteOpen } from '@/store/redux/slices/ui-slice';

const groupIcons: Record<SearchHit['group'], LucideIcon> = {
  Notes: StickyNote,
  Tasks: ListTodo,
  Events: CalendarDays,
  Journal: NotebookPen,
  Habits: Flame,
  Bookmarks: Bookmark,
};

export function CommandMenu() {
  const open = useAppSelector((state) => state.ui.commandPaletteOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        dispatch(setCommandPaletteOpen(true));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (!q) return;
    timer.current = setTimeout(async () => {
      const result = await globalSearchAction({ q });
      if (result.ok && result.data) {
        setResults(result.data);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) setResults([]);
  }

  function go(href: string) {
    dispatch(setCommandPaletteOpen(false));
    router.push(href);
  }

  const grouped = new Map<SearchHit['group'], SearchHit[]>();
  for (const hit of results) {
    const list = grouped.get(hit.group) ?? [];
    list.push(hit);
    grouped.set(hit.group, list);
  }

  return (
    <CommandDialog open={open} onOpenChange={(next) => dispatch(setCommandPaletteOpen(next))}>
      <CommandInput
        placeholder="Search notes, tasks, events…"
        value={query}
        onValueChange={handleQueryChange}
      />
      <CommandList>
        {query.trim() ? (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            {[...grouped.entries()].map(([group, hits]) => {
              const Icon = groupIcons[group];
              return (
                <CommandGroup key={group} heading={group}>
                  {hits.map((hit) => (
                    <CommandItem key={`${group}-${hit.id}`} onSelect={() => go(hit.href)}>
                      <Icon className="size-4" />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{hit.title}</span>
                        {hit.subtitle ? (
                          <span className="text-muted-foreground truncate text-xs">
                            {hit.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </>
        ) : (
          <>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigate">
              {allNav.map((item) => (
                <CommandItem key={item.href} value={item.title} onSelect={() => go(item.href)}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                  <span className="text-muted-foreground ml-auto text-xs">{item.description}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => go('/notes')}>New note</CommandItem>
              <CommandItem onSelect={() => go('/tasks')}>New task</CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
