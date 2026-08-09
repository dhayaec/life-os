import { Skeleton } from '@/components/ui/skeleton';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELLS = Array.from({ length: 35 }, (_, i) => i);

export function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-44" />
        <div className="flex items-center gap-2">
          <Skeleton variant="shimmer" className="h-9 w-16" />
          <Skeleton variant="shimmer" className="size-9 rounded-md" />
          <Skeleton variant="shimmer" className="size-9 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <Skeleton key={day} variant="shimmer" className="h-4 w-10 justify-self-center" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {CELLS.map((n, idx) => (
          <div key={n} className="flex min-h-24 flex-col gap-1 rounded-md border p-2">
            <Skeleton variant="shimmer" className="h-4 w-6" />
            {idx % 7 === 1 || idx % 7 === 4 ? (
              <Skeleton variant="shimmer" className="mt-auto h-3.5 w-full rounded-full" />
            ) : null}
            {idx % 7 === 4 ? (
              <Skeleton variant="shimmer" className="h-3.5 w-3/4 rounded-full" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
