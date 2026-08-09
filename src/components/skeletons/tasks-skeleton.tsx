import { Skeleton } from '@/components/ui/skeleton';

const FILTERS = Array.from({ length: 4 }, (_, i) => i);
const ROWS = Array.from({ length: 5 }, (_, i) => i);

export function TasksSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-24" />
        <Skeleton variant="shimmer" className="h-9 w-20" />
      </div>
      <Skeleton variant="shimmer" className="h-10 w-full" />
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((n) => (
          <Skeleton key={n} variant="shimmer" className="h-8 w-20 rounded-full" />
        ))}
        <Skeleton variant="shimmer" className="h-9 ml-auto w-40" />
      </div>
      <div className="space-y-2">
        {ROWS.map((n) => (
          <div key={n} className="flex items-center gap-3 rounded-lg border p-3">
            <Skeleton variant="shimmer" className="size-5 rounded" />
            <Skeleton variant="shimmer" className="h-4 flex-1" />
            <Skeleton variant="shimmer" className="h-4 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
