import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { getNotesPage, serializeNote } from '@/features/notes/services/note-service';
import { NoteList } from '@/features/notes/components/note-list';

export const metadata: Metadata = { title: 'Trash' };

export default async function TrashPage() {
  const user = await requireUser();
  const { items } = await getNotesPage(user.id, { trashed: true });

  return <NoteList notes={items.map(serializeNote)} trashed />;
}
