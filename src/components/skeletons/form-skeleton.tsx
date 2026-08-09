import { Skeleton } from '@/components/ui/skeleton';

const FIELDS = Array.from({ length: 4 }, (_, i) => i);

export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-8 w-32" />
        <Skeleton variant="shimmer" className="h-9 w-24" />
      </div>
      <div className="space-y-5 rounded-xl border p-6">
        {FIELDS.map((n) => (
          <div key={n} className="space-y-2">
            <Skeleton variant="shimmer" className="h-3 w-20" />
            <Skeleton variant="shimmer" className="h-9 w-full" />
          </div>
        ))}
        <Skeleton variant="shimmer" className="h-9 w-28" />
      </div>
    </div>
  );
}
