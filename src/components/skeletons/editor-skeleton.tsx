import { Skeleton } from '@/components/ui/skeleton';

export function EditorSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="shimmer" className="size-9 rounded-md" />
        <Skeleton variant="shimmer" className="h-4 w-16" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton variant="shimmer" className="h-9 w-20" />
          <Skeleton variant="shimmer" className="h-9 w-20" />
          <Skeleton variant="shimmer" className="size-9 rounded-md" />
          <Skeleton variant="shimmer" className="size-9 rounded-md" />
        </div>
      </div>
      <Skeleton variant="shimmer" className="h-9 w-full" />
      <Skeleton variant="shimmer" className="h-8 w-72" />
      <Skeleton variant="shimmer" className="h-72 w-full rounded-lg" />
    </div>
  );
}
