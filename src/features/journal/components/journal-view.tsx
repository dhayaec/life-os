'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EntryDialog, type EntryInitial } from '@/features/journal/components/entry-dialog';
import type { JournalEntryItem, JournalMood } from '@/features/journal/services/journal-service';

const moodStyles: Record<JournalMood, { color: string; label: string }> = {
  terrible: { color: '#ef4444', label: 'Terrible' },
  bad: { color: '#f97316', label: 'Bad' },
  okay: { color: '#eab308', label: 'Okay' },
  good: { color: '#22c55e', label: 'Good' },
  great: { color: '#10b981', label: 'Great' },
};

export function JournalView({ entries }: { entries: JournalEntryItem[] }) {
  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; entry: JournalEntryItem } | null
  >(null);

  const dialogInitial: EntryInitial | null = dialog
    ? dialog.mode === 'edit'
      ? {
          id: dialog.entry.id,
          title: dialog.entry.title ?? '',
          content: dialog.entry.content,
          mood: dialog.entry.mood,
          entryAt: dialog.entry.entryAt,
        }
      : {
          id: null,
          title: '',
          content: '',
          mood: 'okay',
          entryAt: new Date().toISOString(),
        }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Journal</h1>
        <Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
          <Plus className="size-4" />
          New entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-md border border-dashed p-12 text-sm">
          <p>No journal entries yet.</p>
          <Button variant="outline" size="sm" onClick={() => setDialog({ mode: 'create' })}>
            Write your first entry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => {
            const mood = moodStyles[entry.mood];
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setDialog({ mode: 'edit', entry })}
                className="flex flex-col gap-1 rounded-md border p-3 text-left hover:bg-accent/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: mood.color }}
                    />
                    <span className="font-medium">
                      {entry.title || formatDateTime(entry.entryAt)}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(entry.entryAt)}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm whitespace-pre-wrap">
                  {entry.content}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <EntryDialog
        key={dialog?.mode === 'edit' ? dialog.entry.id : dialog ? 'new' : 'none'}
        initial={dialogInitial}
        open={dialog !== null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
