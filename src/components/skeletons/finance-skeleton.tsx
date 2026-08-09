import { Skeleton } from '@/components/ui/skeleton';

const SUMMARY_CARDS = Array.from({ length: 3 }, (_, i) => i);
const BUDGETS = Array.from({ length: 4 }, (_, i) => i);
const TRANSACTIONS = Array.from({ length: 5 }, (_, i) => i);

export function FinanceSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton variant="shimmer" className="h-9 w-24" />
          <Skeleton variant="shimmer" className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SUMMARY_CARDS.map((n) => (
          <div key={n} className="space-y-2 rounded-xl border p-4">
            <Skeleton variant="shimmer" className="h-4 w-20" />
            <Skeleton variant="shimmer" className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton variant="shimmer" className="h-60 rounded-xl" />
        <div className="space-y-4 rounded-xl border p-4">
          {BUDGETS.map((n) => (
            <div key={n} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton variant="shimmer" className="h-4 w-24" />
                <Skeleton variant="shimmer" className="h-4 w-12" />
              </div>
              <Skeleton variant="shimmer" className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {TRANSACTIONS.map((n) => (
          <div key={n} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton variant="shimmer" className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="shimmer" className="h-4 w-2/5" />
              <Skeleton variant="shimmer" className="h-3 w-3/5" />
            </div>
            <Skeleton variant="shimmer" className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
