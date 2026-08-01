'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function NotesSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('search') ?? '');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-4 max-w-sm">
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search notes…"
        aria-label="Search notes"
        className="bg-muted/40 h-9 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </form>
  );
}
