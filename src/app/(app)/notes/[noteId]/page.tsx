import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNote, serializeNote } from '@/features/notes/services/note-service';
import { NoteEditor } from '@/features/notes/components/note-editor';

export const metadata: Metadata = { title: 'Note' };

export default async function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const user = await requireUser();
  const { noteId } = await params;
  const note = await getNote(user.id, noteId);

  // Render the editor shell from the id even when the note is not on the server yet
  // (a local-only note created offline). The editor resolves content from the store.
  return <NoteEditor key={noteId} id={noteId} note={note ? serializeNote(note) : null} />;
}
