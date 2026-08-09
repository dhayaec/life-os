import { Skeleton } from '@/components/ui/skeleton';

const ROWS = Array.from({ length: 5 }, (_, i) => i);

export function NotesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton variant="shimmer" className="h-10 w-full" />
      <div className="divide-y rounded-lg border">
        {ROWS.map((n) => (
          <div key={n} className="flex items-start gap-3 p-3">
            <Skeleton variant="shimmer" className="mt-1 size-5 shrink-0 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="shimmer" className="h-4 w-1/2" />
              <Skeleton variant="shimmer" className="h-3 w-4/5" />
            </div>
            <Skeleton variant="shimmer" className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
