import { TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 p-10 text-center',
        className
      )}
      role="alert"
    >
      <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
        <TriangleAlert className="text-destructive size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
    </div>
  );
}
