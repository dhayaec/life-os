import type { Metadata } from 'next';

import { requireUser } from '@/server/session';
import { FinanceView } from '@/features/finance/components/finance-view';
import { getFinanceOverview } from '@/features/finance/services/finance-service';

export const metadata: Metadata = { title: 'Finance' };

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const { month: monthParam } = await searchParams;

  const now = new Date();
  const match = /^(\d{4})-(\d{2})$/.exec(monthParam ?? '');
  const year = match ? Number(match[1]) : now.getFullYear();
  const month =
    match && Number(match[2]) >= 1 && Number(match[2]) <= 12
      ? Number(match[2])
      : now.getMonth() + 1;

  const data = await getFinanceOverview(user.id, year, month);

  return <FinanceView {...data} />;
}
