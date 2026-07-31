'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
import { useAppDispatch, useAppSelector } from '@/store/redux/hooks';
import { setCommandPaletteOpen } from '@/store/redux/slices/ui-slice';

export function CommandMenu() {
  const open = useAppSelector((state) => state.ui.commandPaletteOpen);
  const dispatch = useAppDispatch();
  const router = useRouter();

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

  return (
    <CommandDialog open={open} onOpenChange={(next) => dispatch(setCommandPaletteOpen(next))}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {allNav.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => {
                router.push(item.href);
                dispatch(setCommandPaletteOpen(false));
              }}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
              <span className="text-muted-foreground ml-auto text-xs">{item.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => router.push('/notes')}>New note</CommandItem>
          <CommandItem onSelect={() => router.push('/tasks')}>New task</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
