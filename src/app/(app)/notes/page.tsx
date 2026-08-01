import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNotes } from '@/features/notes/services/note-service';
import { NoteList, type NoteListItem } from '@/features/notes/components/note-list';
import { NewNoteButton } from '@/features/notes/components/new-note-button';
import { NotesSearch } from '@/features/notes/components/notes-search';

export const metadata: Metadata = { title: 'Notes' };

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; favorite?: string; search?: string }>;
}) {
  const user = await requireUser();
  const { folder, favorite, search } = await searchParams;

  const notes = await getNotes(user.id, {
    ...(folder ? { folderId: folder } : {}),
    ...(favorite ? { favorite: favorite === '1' } : {}),
    ...(search ? { search } : {}),
  });

  const items: NoteListItem[] = notes.map((note) => ({
    id: note.id,
    title: note.title,
    content: note.content,
    isFavorite: note.isFavorite,
    trashedAt: note.trashedAt?.toISOString() ?? null,
    updatedAt: note.updatedAt.toISOString(),
    tags: note.tags,
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <NotesSearch />
        <NewNoteButton />
      </div>
      <NoteList notes={items} />
    </>
  );
}
