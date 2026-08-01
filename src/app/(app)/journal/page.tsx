import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { JournalView } from '@/features/journal/components/journal-view';
import { getJournalEntries } from '@/features/journal/services/journal-service';

export const metadata: Metadata = { title: 'Journal' };

export default async function JournalPage() {
  const user = await requireUser();
  const entries = await getJournalEntries(user.id);

  return <JournalView entries={entries} />;
}
