import { Skeleton } from '@/components/ui/skeleton';

const DAYS = Array.from({ length: 31 }, (_, i) => i);
const ROWS = Array.from({ length: 4 }, (_, i) => i);

export function HabitsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-40" />
        <Skeleton variant="shimmer" className="h-9 w-24" />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <div className="min-w-max">
          <div className="flex items-center gap-1 border-b px-2 py-2">
            <div className="w-44 pr-2" />
            {DAYS.map((n) => (
              <Skeleton key={n} variant="shimmer" className="h-4 w-9 shrink-0" />
            ))}
          </div>
          {ROWS.map((n) => (
            <div key={n} className="flex items-center gap-1 border-b px-2 py-3 last:border-b-0">
              <div className="w-44 space-y-2 pr-2">
                <Skeleton variant="shimmer" className="h-4 w-32" />
                <Skeleton variant="shimmer" className="h-3 w-20" />
              </div>
              {DAYS.map((m) => (
                <Skeleton key={m} variant="shimmer" className="size-7 shrink-0 rounded-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
