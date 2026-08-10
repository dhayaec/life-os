import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { ShoppingView } from '@/features/shopping/components/shopping-view';
import { getShoppingItems } from '@/features/shopping/services/shopping-service';

export const metadata: Metadata = { title: 'Shopping' };

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireUser();
  const { category: categoryParam } = await searchParams;

  const { items, categories } = await getShoppingItems(user.id);
  const category = categoryParam && categories.includes(categoryParam) ? categoryParam : null;

  return <ShoppingView items={items} category={category} />;
}
