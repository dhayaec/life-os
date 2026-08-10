import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNotesPage, serializeNote } from '@/features/notes/services/note-service';
import { NoteList } from '@/features/notes/components/note-list';
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

  const { items } = await getNotesPage(user.id, {
    ...(folder ? { folderId: folder } : {}),
    ...(favorite ? { favorite: favorite === '1' } : {}),
    ...(search ? { search } : {}),
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <NotesSearch />
        <NewNoteButton />
      </div>
      <NoteList notes={items.map(serializeNote)} />
    </>
  );
}
