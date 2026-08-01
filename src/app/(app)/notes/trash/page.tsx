import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNotes } from '@/features/notes/services/note-service';
import { NoteList, type NoteListItem } from '@/features/notes/components/note-list';

export const metadata: Metadata = { title: 'Trash' };

export default async function TrashPage() {
  const user = await requireUser();
  const notes = await getNotes(user.id, { trashed: true });

  const items: NoteListItem[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    isFavorite: note.isFavorite,
    trashedAt: note.trashedAt?.toISOString() ?? null,
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags,
  }));

  return <NoteList notes={items} trashed />;
}
