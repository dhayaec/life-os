'use client';

import { formatDistanceToNow } from 'date-fns';
import { Archive, RotateCcw, Star, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import {
  getNotesPageAction,
  hardDeleteNoteAction,
  restoreNoteAction,
  softDeleteNoteAction,
  toggleFavoriteAction,
} from '@/features/notes/actions';

import { useSyncedState } from '@/hooks/use-synced-state';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

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
  initialNextCursor?: string | null;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NoteList({ notes, trashed = false, initialNextCursor = null }: NoteListProps) {
  useRouteLoadedSignal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useSyncedState(notes);
  const [nextCursor, setNextCursor] = useSyncedState(initialNextCursor);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  async function runAction(
    action: () => Promise<{ ok: boolean; error?: string }>,
    id: string,
    apply: (snapshot: NoteListItem) => NoteListItem | null
  ) {
    if (busy.has(id)) return;
    const snapshot = items.find((n) => n.id === id);
    if (!snapshot) return;
    const index = items.findIndex((n) => n.id === id);
    setBusy((prev) => new Set(prev).add(id));
    const next = apply(snapshot);
    setItems((prev) =>
      next === null ? prev.filter((n) => n.id !== id) : prev.map((n) => (n.id === id ? next : n))
    );
    const result = await action();
    setBusy((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (!result.ok) {
      setItems((prev) =>
        next === null
          ? (() => {
              const arr = [...prev];
              arr.splice(index, 0, snapshot);
              return arr;
            })()
          : prev.map((n) => (n.id === id ? snapshot : n))
      );
      toast.error(result.error ?? 'Something went wrong');
      return;
    }
    router.refresh();
  }

  async function loadMore() {
    if (loading || !nextCursor) return;
    setLoading(true);
    try {
      const favorite = searchParams.get('favorite');
      const result = await getNotesPageAction({
        cursor: nextCursor,
        folderId: searchParams.get('folder') ?? undefined,
        favorite: favorite ? favorite === '1' : undefined,
        search: searchParams.get('search') ?? undefined,
        trashed,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Something went wrong');
        return;
      }
      const data = result.data;
      if (!data) return;
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
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
    <>
      <ul className="divide-y">
        {items.map((note) => (
          <li key={note.id} className="group flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/notes/${note.id}`} className="block">
                <h3 className="flex items-center gap-2 truncate font-medium">
                  {note.isFavorite ? (
                    <Star className="text-amber-500 size-3.5 fill-current" />
                  ) : null}
                  {note.title}
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
                    disabled={busy.has(note.id)}
                    onClick={() =>
                      runAction(
                        () => restoreNoteAction({ id: note.id }),
                        note.id,
                        () => null
                      )
                    }
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete forever"
                    disabled={busy.has(note.id)}
                    onClick={() =>
                      runAction(
                        () => hardDeleteNoteAction({ id: note.id }),
                        note.id,
                        () => null
                      )
                    }
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
                    disabled={busy.has(note.id)}
                    onClick={() =>
                      runAction(
                        () => toggleFavoriteAction({ id: note.id }),
                        note.id,
                        (n) => ({ ...n, isFavorite: !n.isFavorite })
                      )
                    }
                  >
                    <Star
                      className={`size-4 ${note.isFavorite ? 'fill-amber-500 text-amber-500' : ''}`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move to trash"
                    disabled={busy.has(note.id)}
                    onClick={() =>
                      runAction(
                        () => softDeleteNoteAction({ id: note.id }),
                        note.id,
                        () => null
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </>
  );
}
