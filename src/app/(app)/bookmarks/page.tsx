import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { BookmarkView } from '@/features/bookmarks/components/bookmark-view';
import { getBookmarks, getCollections } from '@/features/bookmarks/services/bookmark-service';

export const metadata: Metadata = { title: 'Bookmarks' };

export default async function BookmarksPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const user = await requireUser();
  const { collection: collectionParam } = await searchParams;

  const collections = await getCollections(user.id);
  const selected =
    collectionParam && collections.some((item) => item.id === collectionParam)
      ? collectionParam
      : null;
  const bookmarks = await getBookmarks(user.id, selected ?? undefined);

  return <BookmarkView bookmarks={bookmarks} collections={collections} collection={selected} />;
}
