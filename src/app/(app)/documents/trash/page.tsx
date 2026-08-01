import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { DocumentsView } from '@/features/documents/components/documents-view';
import { getDocuments } from '@/features/documents/services/documents-service';

export const metadata: Metadata = { title: 'Trash' };

export default async function DocumentsTrashPage() {
  const user = await requireUser();
  const documents = await getDocuments(user.id, { trashed: true });

  return <DocumentsView userId={user.id} documents={documents} trashed={true} />;
}
