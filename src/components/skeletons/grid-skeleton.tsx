import { Skeleton } from '@/components/ui/skeleton';

const CARDS = Array.from({ length: 6 }, (_, i) => i);

export function GridSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton variant="shimmer" className="h-9 w-28" />
          <Skeleton variant="shimmer" className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((n) => (
          <div key={n} className="space-y-3 rounded-xl border p-4">
            <Skeleton variant="shimmer" className="size-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton variant="shimmer" className="h-4 w-2/3" />
              <Skeleton variant="shimmer" className="h-3 w-full" />
              <Skeleton variant="shimmer" className="h-3 w-5/6" />
            </div>
            <Skeleton variant="shimmer" className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
