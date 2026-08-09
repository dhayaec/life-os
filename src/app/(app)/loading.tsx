'use client';

import { usePathname } from 'next/navigation';

import { RouteSkeleton } from '@/components/skeletons/route-skeleton';

export default function Loading() {
  const pathname = usePathname();
  return <RouteSkeleton pathname={pathname ?? ''} />;
}
