import { NotebookPen } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function JournalPage() {
  return (
    <ModulePlaceholder title="Journal" description="Daily entries and mood" icon={NotebookPen} />
  );
}
