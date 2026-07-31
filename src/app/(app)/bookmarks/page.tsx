import { Bookmark } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function BookmarksPage() {
  return (
    <ModulePlaceholder title="Bookmarks" description="Save links and resources" icon={Bookmark} />
  );
}
