'use client';

import { useState } from 'react';
import { FileText, FolderGit2, FolderPlus, Globe, Play, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookmarkDialog,
  type BookmarkInitial,
} from '@/features/bookmarks/components/bookmark-dialog';
import { CollectionDialog } from '@/features/bookmarks/components/collection-dialog';
import type {
  BookmarkItem,
  BookmarkTypeLiteral,
  CollectionItem,
} from '@/features/bookmarks/services/bookmark-service';

import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

const typeConfig: Record<BookmarkTypeLiteral, { label: string; icon: LucideIcon }> = {
  article: { label: 'Article', icon: FileText },
  video: { label: 'Video', icon: Play },
  repo: { label: 'Repo', icon: FolderGit2 },
  website: { label: 'Website', icon: Globe },
};

export function BookmarkView({
  bookmarks,
  collections,
  collection,
}: {
  bookmarks: BookmarkItem[];
  collections: CollectionItem[];
  collection: string | null;
}) {
  useRouteLoadedSignal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [bookmarkDialog, setBookmarkDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; bookmark: BookmarkItem } | null
  >(null);
  const [collectionDialog, setCollectionDialog] = useState(false);

  function onCollectionChange(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('collection', value);
    else params.delete('collection');
    router.push(`${pathname}?${params.toString()}`);
  }

  const bookmarkDialogInitial: BookmarkInitial | null = bookmarkDialog
    ? bookmarkDialog.mode === 'edit'
      ? {
          id: bookmarkDialog.bookmark.id,
          url: bookmarkDialog.bookmark.url,
          title: bookmarkDialog.bookmark.title,
          description: bookmarkDialog.bookmark.description ?? '',
          type: bookmarkDialog.bookmark.type,
          collectionId: bookmarkDialog.bookmark.collectionId,
          tags: bookmarkDialog.bookmark.tags.join(', '),
        }
      : {
          id: null,
          url: '',
          title: '',
          description: '',
          type: 'website',
          collectionId: null,
          tags: '',
        }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Bookmarks</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={collection ?? ''} onValueChange={onCollectionChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All bookmarks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All bookmarks</SelectItem>
              {collections.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setCollectionDialog(true)}>
            <FolderPlus className="size-4" />
            Collection
          </Button>
          <Button size="sm" onClick={() => setBookmarkDialog({ mode: 'create' })}>
            <Plus className="size-4" />
            Bookmark
          </Button>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-md border border-dashed p-12 text-sm">
          <p>{collection ? 'No bookmarks in this collection.' : 'No bookmarks yet.'}</p>
          <Button variant="outline" size="sm" onClick={() => setBookmarkDialog({ mode: 'create' })}>
            Add your first bookmark
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onEdit={() => setBookmarkDialog({ mode: 'edit', bookmark })}
            />
          ))}
        </div>
      )}

      <BookmarkDialog
        key={
          bookmarkDialog?.mode === 'edit'
            ? bookmarkDialog.bookmark.id
            : bookmarkDialog
              ? 'new'
              : 'none'
        }
        initial={bookmarkDialogInitial}
        collections={collections}
        open={bookmarkDialog !== null}
        onClose={() => setBookmarkDialog(null)}
      />
      <CollectionDialog open={collectionDialog} onClose={() => setCollectionDialog(false)} />
    </div>
  );
}

function BookmarkCard({ bookmark, onEdit }: { bookmark: BookmarkItem; onEdit: () => void }) {
  const type = typeConfig[bookmark.type];
  const Icon = type.icon;
  return (
    <div className="flex flex-col gap-2 rounded-md border p-3 hover:bg-accent/50">
      <div className="flex items-center gap-2">
        <Icon className="text-muted-foreground size-4 shrink-0" />
        <a
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
          className="truncate font-medium hover:underline"
        >
          {bookmark.title}
        </a>
      </div>
      {bookmark.description ? (
        <p className="text-muted-foreground line-clamp-2 text-sm">{bookmark.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="secondary" className="text-[10px]">
          {type.label}
        </Badge>
        {bookmark.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px]">
            {tag}
          </Badge>
        ))}
        <span className="text-muted-foreground ml-auto text-[10px]">{hostOf(bookmark.url)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span suppressHydrationWarning className="text-muted-foreground text-[10px]">
          {formatDate(bookmark.createdAt)}
        </span>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
