import { ShoppingCart } from 'lucide-react';

import { ModulePlaceholder } from '@/components/common/module-placeholder';

export default function ShoppingPage() {
  return (
    <ModulePlaceholder title="Shopping" description="Lists and checklists" icon={ShoppingCart} />
  );
}
