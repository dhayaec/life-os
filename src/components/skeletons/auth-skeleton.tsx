import { Skeleton } from '@/components/ui/skeleton';

const FIELDS = Array.from({ length: 3 }, (_, i) => i);

export function AuthSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      {FIELDS.map((n) => (
        <div key={n} className="space-y-2">
          <Skeleton variant="shimmer" className="h-3 w-20" />
          <Skeleton variant="shimmer" className="h-10 w-full" />
        </div>
      ))}
      <Skeleton variant="shimmer" className="h-10 w-full" />
    </div>
  );
}
