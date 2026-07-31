import type { LucideIcon } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} is coming soon`}
        description="This module is part of the LifeOS roadmap and will be built in a later phase."
      />
    </div>
  );
}
