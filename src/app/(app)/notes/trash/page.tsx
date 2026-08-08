import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNotesPage, noteExcerpt } from '@/features/notes/services/note-service';
import { NoteList, type NoteListItem } from '@/features/notes/components/note-list';

export const metadata: Metadata = { title: 'Trash' };

export default async function TrashPage() {
  const user = await requireUser();
  const { items, nextCursor } = await getNotesPage(user.id, { trashed: true });

  const noteItems: NoteListItem[] = items.map((note) => ({
    id: note.id,
    title: note.title,
    content: noteExcerpt(note.content),
    isFavorite: note.isFavorite,
    trashedAt: note.trashedAt?.toISOString() ?? null,
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags,
  }));

  return <NoteList notes={noteItems} trashed initialNextCursor={nextCursor} />;
}
