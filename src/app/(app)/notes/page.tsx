import { StickyNote } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function NotesPage() {
  return (
    <ModulePlaceholder
      title="Notes"
      description="Capture and organize thoughts"
      icon={StickyNote}
    />
  );
}
