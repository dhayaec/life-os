import { Skeleton } from '@/components/ui/skeleton';

const ROWS = Array.from({ length: 6 }, (_, i) => i);

export function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-32" />
        <Skeleton variant="shimmer" className="h-9 w-24" />
      </div>
      <div className="space-y-2">
        {ROWS.map((n) => (
          <div key={n} className="flex items-center gap-3 rounded-lg border p-4">
            <Skeleton variant="shimmer" className="size-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="shimmer" className="h-4 w-1/3" />
              <Skeleton variant="shimmer" className="h-3 w-2/3" />
            </div>
            <Skeleton variant="shimmer" className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
