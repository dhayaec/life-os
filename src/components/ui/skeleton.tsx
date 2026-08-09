import { cn } from '@/lib/utils';

function Skeleton({
  variant = 'default',
  className,
  ...props
}: React.ComponentProps<'div'> & { variant?: 'default' | 'shimmer' }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md',
        variant === 'shimmer' ? 'shimmer' : 'bg-accent animate-pulse',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
