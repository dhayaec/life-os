'use client';

import { formatDistanceToNow } from 'date-fns';
import { Archive, RotateCcw, Star, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import {
  hardDeleteNoteAction,
  restoreNoteAction,
  softDeleteNoteAction,
  toggleFavoriteAction,
} from '@/features/notes/actions';

export type NoteListItem = {
  id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  trashedAt: string | null;
  updatedAt: string;
  tags: { tag: { id: string; name: string } }[];
};

type NoteListProps = {
  notes: NoteListItem[];
  trashed?: boolean;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NoteList({ notes, trashed = false }: NoteListProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function runAction(action: () => Promise<{ ok: boolean; error?: string }>, id: string) {
    setBusy(id);
    const result = await action();
    setBusy(null);
    if (!result.ok) {
      toast.error(result.error ?? 'Something went wrong');
      return;
    }
    router.refresh();
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={trashed ? Trash2 : Archive}
        title={trashed ? 'Trash is empty' : 'No notes yet'}
        description={
          trashed ? 'Deleted notes appear here for 30 days.' : 'Create a note to get started.'
        }
      />
    );
  }

  return (
    <ul className="divide-y">
      {notes.map((note) => (
        <li key={note.id} className="group flex items-start gap-3 py-3">
          <div className="min-w-0 flex-1">
            <Link href={`/notes/${note.id}`} className="block">
              <h3 className="flex items-center gap-2 truncate font-medium">
                {note.isFavorite ? <Star className="text-amber-500 size-3.5 fill-current" /> : null}
                {note.title || 'Untitled'}
              </h3>
              {note.content ? (
                <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                  {stripHtml(note.content)}
                </p>
              ) : null}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span suppressHydrationWarning>
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </span>
                {note.tags.map(({ tag }) => (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            {trashed ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Restore"
                  disabled={busy === note.id}
                  onClick={() => runAction(() => restoreNoteAction({ id: note.id }), note.id)}
                >
                  <RotateCcw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete forever"
                  disabled={busy === note.id}
                  onClick={() => runAction(() => hardDeleteNoteAction({ id: note.id }), note.id)}
                >
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle favorite"
                  disabled={busy === note.id}
                  onClick={() => runAction(() => toggleFavoriteAction({ id: note.id }), note.id)}
                >
                  <Star
                    className={`size-4 ${note.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Move to trash"
                  disabled={busy === note.id}
                  onClick={() => runAction(() => softDeleteNoteAction({ id: note.id }), note.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
