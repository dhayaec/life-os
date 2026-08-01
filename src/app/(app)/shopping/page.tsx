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

  const categories = await getShoppingItems(user.id).then((data) => data.categories);
  const category = categoryParam && categories.includes(categoryParam) ? categoryParam : null;

  const data = await getShoppingItems(user.id, category);

  return <ShoppingView {...data} category={category} />;
}
