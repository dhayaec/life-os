import { Skeleton } from '@/components/ui/skeleton';

const QUICK_ACTIONS = Array.from({ length: 5 }, (_, i) => i);
const STAT_CARDS = Array.from({ length: 4 }, (_, i) => i);
const WIDGET_CARDS = Array.from({ length: 6 }, (_, i) => i);

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-2">
          <Skeleton variant="shimmer" className="h-7 w-56" />
          <Skeleton variant="shimmer" className="h-4 w-32" />
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((n) => (
            <Skeleton key={n} variant="shimmer" className="h-8 w-20 rounded-md" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((n) => (
          <div key={n} className="rounded-xl border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton variant="shimmer" className="size-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-20" />
                <Skeleton variant="shimmer" className="h-6 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton variant="shimmer" className="h-56 rounded-xl lg:col-span-2" />
        {WIDGET_CARDS.map((n) => (
          <Skeleton key={n} variant="shimmer" className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
