import { ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="bg-brand-gradient flex flex-1 flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-slate-900 text-4xl font-semibold tracking-tight">LifeOS</h1>
        <p className="text-slate-700 mx-auto max-w-md">
          Your personal operating system — notes, tasks, calendar, habits, and more, all in one
          place.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/dashboard">
          <LayoutDashboard />
          Open dashboard
          <ArrowRight />
        </Link>
      </Button>
    </main>
  );
}
