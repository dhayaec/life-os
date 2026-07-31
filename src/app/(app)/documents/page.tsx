import { FolderOpen } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function DocumentsPage() {
  return <ModulePlaceholder title="Documents" description="Files and folders" icon={FolderOpen} />;
}
