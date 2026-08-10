'use client';

import { formatDistanceToNow } from 'date-fns';
import { Archive, RotateCcw, Star, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import type { SyncNote } from '@/features/notes/services/note-service';

import { useLocalQuery } from '@/hooks/use-local-query';
import { useMounted } from '@/hooks/use-mounted';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

const NOTES_PAGE_SIZE = 50;

type NoteListProps = {
  notes: SyncNote[];
  trashed?: boolean;
};

export function NoteList({ notes: initialNotes, trashed = false }: NoteListProps) {
  useRouteLoadedSignal();
  const searchParams = useSearchParams();
  const folder = searchParams.get('folder');
  const favorite = searchParams.get('favorite');
  const search = searchParams.get('search');
  const [page, setPage] = useState(1);
  const mounted = useMounted();
  const { enqueue } = useSyncMutation('notes');

  const { rows, hydrated } = useLocalQuery<SyncNote>(
    'notes',
    (all) => selectNotes(all, trashed, folder, favorite, search),
    [trashed, folder, favorite, search]
  );

  useEffect(() => {
    void syncEngine.hydrateSeed('notes', initialNotes);
  }, [initialNotes]);

  const all = rows ?? [];
  const items = all.slice(0, page * NOTES_PAGE_SIZE);

  async function loadMore() {
    if (all.length <= page * NOTES_PAGE_SIZE) return;
    setPage((prev) => prev + 1);
  }

  if (!hydrated) {
    return (
      <ul className="divide-y">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="py-3">
            <div className="bg-muted h-4 w-1/3 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-3 w-2/3 animate-pulse rounded" />
          </li>
        ))}
      </ul>
    );
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
                    {noteExcerptClient(note.content)}
                  </p>
                ) : null}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {mounted
                      ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })
                      : ''}
                  </span>
                  {note.tagNames.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
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
                    onClick={() =>
                      enqueue('update', {
                        id: note.id,
                        trashedAt: null,
                        updatedAt: new Date().toISOString(),
                      })
                    }
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete forever"
                    onClick={() =>
                      enqueue('delete', { id: note.id, deletedAt: new Date().toISOString() })
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
                    onClick={() =>
                      enqueue('update', {
                        id: note.id,
                        isFavorite: !note.isFavorite,
                        updatedAt: new Date().toISOString(),
                      })
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
                    onClick={() =>
                      enqueue('update', {
                        id: note.id,
                        trashedAt: new Date().toISOString(),
                        archived: false,
                        updatedAt: new Date().toISOString(),
                      })
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
      {all.length > page * NOTES_PAGE_SIZE ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        </div>
      ) : null}
    </>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function noteExcerptClient(content: string): string {
  const plain = stripHtml(content);
  return plain.length > 160 ? `${plain.slice(0, 160)}…` : plain;
}

function selectNotes(
  notes: SyncNote[],
  trashed: boolean,
  folder: string | null,
  favorite: string | null,
  search: string | null
): SyncNote[] {
  let result = notes;
  if (trashed) {
    result = result.filter((n) => n.trashedAt !== null);
  } else {
    result = result.filter((n) => n.trashedAt === null && !n.archived);
    if (folder) result = result.filter((n) => n.folderId === folder);
    if (favorite === '1') result = result.filter((n) => n.isFavorite);
  }
  if (search) {
    const query = search.toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(query) || stripHtml(n.content).toLowerCase().includes(query)
    );
  }
  return [...result].sort((a, b) => {
    const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
    if (byUpdated !== 0) return byUpdated;
    return b.id.localeCompare(a.id);
  });
}
