import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { requireUser } from '@/server/session';
import { getNote } from '@/features/notes/services/note-service';
import { NoteEditor } from '@/features/notes/components/note-editor';

export const metadata: Metadata = { title: 'Note' };

export default async function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const user = await requireUser();
  const { noteId } = await params;
  const note = await getNote(user.id, noteId);

  if (!note) {
    notFound();
  }

  return (
    <NoteEditor
      key={note.id}
      id={note.id}
      title={note.title}
      content={note.content}
      isFavorite={note.isFavorite}
      trashedAt={note.trashedAt?.toISOString() ?? null}
      tags={note.tags}
    />
  );
}
