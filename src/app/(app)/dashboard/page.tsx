import { LayoutDashboard } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      title="Dashboard"
      description="Overview of your day"
      icon={LayoutDashboard}
    />
  );
}
