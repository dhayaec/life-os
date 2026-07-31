import { Wallet } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function FinancePage() {
  return (
    <ModulePlaceholder title="Finance" description="Track expenses and budgets" icon={Wallet} />
  );
}
