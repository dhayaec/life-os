import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { NoteEditor } from '@/features/notes/components/note-editor';

export const metadata: Metadata = { title: 'New Note' };

export default async function NewNotePage() {
  await requireUser();
  return <NoteEditor id="new" note={null} />;
}
