import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  FileText,
  Flame,
  FolderOpen,
  Layers,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  StickyNote,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LifeIcon, LifeLogo } from '@/components/common/logo';
import { getSession } from '@/server/session';
import { cn } from '@/lib/utils';

export default async function Home() {
  const session = await getSession();
  const signedIn = Boolean(session);

  return (
    <main className="flex-1">
      <Header signedIn={signedIn} />
      <Hero />
      <HeroVisual />
      <Benefits />
      <Features />
      <ClosingStatement />
    </main>
  );
}

function Header({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link href="/" aria-label="LifeOS home">
          <LifeLogo className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Site">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {!signedIn && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/40"
          >
            <Link href={signedIn ? '/dashboard' : '/signup'}>
              {signedIn ? 'Open dashboard' : 'Create account'}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 md:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
          <LifeIcon className="size-4" />A personal operating system
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
          One calm home for your whole life.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Notes, tasks, calendar, habits, money, and files — organized together in one private space
          that adapts to how you actually live.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Free to start · Your data stays yours</p>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-12 pb-16 md:pb-20">
      <div className="relative">
        <div className="pointer-events-none absolute -top-12 -right-8 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative rounded-2xl border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
              <span className="size-2.5 rounded-full bg-muted-foreground/25" />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
              <Search className="size-3.5" />
              <span className="flex-1">Search everything…</span>
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Synced
            </span>
          </div>

          <div className="grid grid-cols-5 gap-3 p-4 sm:p-5">
            <div className="col-span-3 flex flex-col gap-3 rounded-xl border bg-background p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Today</span>
                <span className="text-xs text-muted-foreground">Tue, Aug 5</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="font-medium">Design review</span>
                  <span className="ml-auto text-xs text-muted-foreground">9:30</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
                  <span className="text-muted-foreground line-through">Send weekly update</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="size-4 text-emerald-500" aria-hidden="true" />
                  <span className="font-medium">Morning run</span>
                  <span className="ml-auto text-xs text-muted-foreground">12 days</span>
                </div>
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-3">
              <div className="rounded-xl border bg-background p-3.5">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="mt-0.5 text-xl font-semibold tracking-tight">$2,480</div>
                <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
                  <span className="h-[40%] w-full rounded-sm bg-muted-foreground/25" />
                  <span className="h-[65%] w-full rounded-sm bg-muted-foreground/25" />
                  <span className="h-[45%] w-full rounded-sm bg-emerald-500" />
                  <span className="h-[80%] w-full rounded-sm bg-emerald-500/70" />
                  <span className="h-[60%] w-full rounded-sm bg-emerald-500" />
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-background p-3.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Flame className="size-4 text-emerald-500" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold">12-day streak</div>
                  <div className="text-xs text-muted-foreground">Keep it going</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    {
      icon: Layers,
      title: 'One calm space',
      description: 'Every part of your life lives together — nothing gets lost in the shuffle.',
    },
    {
      icon: ShieldCheck,
      title: 'Private by design',
      description: 'Your data stays yours. No ads, no noise — just your life.',
    },
    {
      icon: Smartphone,
      title: 'Wherever you are',
      description: 'Open your space from any screen and pick up right where you left off.',
    },
  ];

  return (
    <section className="border-y bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <item.icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
          All in one place
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Everything you need to run your life, in one place.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Each feature is built to feel effortless — and everything works together by design.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureTile key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}

function FeatureTile({ feature }: { feature: Feature }) {
  const { icon: Icon, title, description, preview } = feature;

  const body = (
    <>
      <PreviewFrame>{preview}</PreviewFrame>
      <div className="flex flex-col gap-1.5 p-5">
        <div className="flex items-center gap-2">
          <Icon
            className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </>
  );

  const className =
    'group flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return feature.href ? (
    <Link href={feature.href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden border-b bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-5">
      <div className="w-full max-w-[230px] overflow-hidden rounded-lg border bg-background text-left shadow-md shadow-black/5 dark:shadow-black/30">
        {children}
      </div>
    </div>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[9px] font-medium',
        className ?? 'bg-muted text-muted-foreground'
      )}
    >
      {children}
    </span>
  );
}

function Line({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-1.5 rounded-full bg-muted-foreground/25', className)}
      aria-hidden="true"
    />
  );
}

function DashboardPreview() {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="h-2 w-16 rounded-full bg-foreground/80" />
        <div className="h-2 w-8 rounded-full bg-emerald-500/70" />
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <div className="rounded-md border p-2">
          <Line className="w-9 bg-muted-foreground/30" />
          <div className="mt-1 h-2 w-6 rounded-full bg-foreground/70" />
        </div>
        <div className="rounded-md border p-2">
          <Line className="w-9 bg-muted-foreground/30" />
          <div className="mt-1 h-2 w-6 rounded-full bg-emerald-500" />
        </div>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <Line className="flex-1" />
          <Line className="w-6 bg-muted-foreground/20" />
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
          <Line className="flex-1 bg-muted-foreground/15" />
        </div>
      </div>
    </div>
  );
}

function NotesPreview() {
  return (
    <div className="px-3 py-2.5">
      <div className="h-2.5 w-20 rounded-full bg-foreground/80" />
      <div className="mt-2 flex flex-col gap-1.5">
        <Line />
        <Line className="w-11/12 bg-muted-foreground/20" />
        <Line className="w-4/6 bg-muted-foreground/15" />
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Chip className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Idea</Chip>
        <Chip>Work</Chip>
      </div>
    </div>
  );
}

function TasksPreview() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
        <Line className="flex-1 bg-muted-foreground/20" />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="size-3 rounded-full border border-muted-foreground/40"
          aria-hidden="true"
        />
        <Line className="flex-1 bg-foreground/60" />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="size-3 rounded-full border border-muted-foreground/40"
          aria-hidden="true"
        />
        <Line className="w-4/6 bg-foreground/60" />
      </div>
      <div className="mt-1">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted-foreground/15">
          <div className="h-full w-1/2 rounded-full bg-emerald-500" />
        </div>
        <div className="mt-1.5 text-right text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
          3 of 6 done
        </div>
      </div>
    </div>
  );
}

function CalendarPreview() {
  const days = [...Array(14)];
  const filled = [2, 5, 6, 9, 12];
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="h-2 w-12 rounded-full bg-foreground/80" />
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-sm bg-muted-foreground/25" />
          <div className="h-2 w-2 rounded-sm bg-muted-foreground/25" />
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-7 gap-1" aria-hidden="true">
        {days.map((_, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key -- decorative day cells
            key={i}
            className={cn(
              'h-2 rounded-[3px]',
              i === 4
                ? 'bg-foreground/70'
                : filled.includes(i)
                  ? 'bg-emerald-500/70'
                  : 'bg-muted-foreground/15'
            )}
          />
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <Line className="flex-1" />
        <Line className="w-6 bg-muted-foreground/20" />
      </div>
    </div>
  );
}

function HabitsPreview() {
  const bars = ['h-3', 'h-6', 'h-4', 'h-8', 'h-5', 'h-7', 'h-4'];
  return (
    <div className="flex flex-col gap-2.5 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Flame className="size-3.5 text-emerald-500" aria-hidden="true" />
        <Line className="h-2 flex-1 bg-foreground/70" />
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">12</span>
      </div>
      <div className="flex h-14 items-end gap-1" aria-hidden="true">
        {bars.map((h, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key -- decorative chart bars
            key={i}
            className={cn(
              'w-full rounded-sm',
              h,
              i >= 4 ? 'bg-emerald-500/80' : 'bg-muted-foreground/20'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key -- decorative week squares
            key={i}
            className={cn(
              'h-1.5 rounded-full',
              i < 5 ? 'bg-emerald-500/80' : 'border border-muted-foreground/30 bg-transparent'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function JournalPreview() {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div className="h-2 w-14 rounded-full bg-foreground/80" />
        <div className="h-2 w-10 rounded-full bg-muted-foreground/20" />
      </div>
      <div className="mt-2.5 flex items-center gap-1.5" aria-hidden="true">
        <span className="size-2 rounded-full bg-emerald-500/30" />
        <span className="size-2 rounded-full bg-emerald-500/60" />
        <span className="size-2.5 rounded-full bg-emerald-500" />
        <span className="size-2 rounded-full bg-muted-foreground/30" />
        <span className="size-2 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        <Line />
        <Line className="w-11/12 bg-muted-foreground/20" />
        <Line className="w-3/5 bg-muted-foreground/15" />
      </div>
    </div>
  );
}

function BookmarksPreview() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <div className="rounded-md border p-2">
        <div className="flex items-center gap-1.5">
          <Bookmark className="size-3 text-emerald-500" aria-hidden="true" />
          <Line className="h-2 flex-1 bg-foreground/70" />
        </div>
        <div className="mt-1.5 flex gap-1">
          <Chip className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Design</Chip>
          <Chip>Reading</Chip>
        </div>
      </div>
      <div className="rounded-md border p-2">
        <Line className="h-2 bg-foreground/60" />
        <div className="mt-1.5 flex gap-1">
          <Chip>Dev</Chip>
        </div>
      </div>
    </div>
  );
}

function FinancePreview() {
  const bars = ['h-4', 'h-7', 'h-5', 'h-9', 'h-6', 'h-8'];
  return (
    <div className="px-3 py-2.5">
      <div className="text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
        Balance
      </div>
      <div className="mt-0.5 text-sm font-semibold tracking-tight">$2,480</div>
      <div className="mt-2 flex h-12 items-end gap-1" aria-hidden="true">
        {bars.map((h, i) => (
          <span
            // eslint-disable-next-line react/no-array-index-key -- decorative chart bars
            key={i}
            className={cn(
              'w-full rounded-sm',
              h,
              i >= 3 ? 'bg-emerald-500/70' : 'bg-muted-foreground/20'
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <Line className="w-10 bg-muted-foreground/25" />
        <Line className="w-6 bg-emerald-500/70" />
      </div>
    </div>
  );
}

function ShoppingPreview() {
  return (
    <div className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex gap-1.5">
        <Chip className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Groceries</Chip>
        <Chip>Errands</Chip>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="size-3 text-emerald-500" aria-hidden="true" />
        <Line className="flex-1 bg-muted-foreground/20" />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="size-3 rounded-full border border-muted-foreground/40"
          aria-hidden="true"
        />
        <Line className="flex-1 bg-foreground/60" />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="size-3 rounded-full border border-muted-foreground/40"
          aria-hidden="true"
        />
        <Line className="w-3/4 bg-foreground/60" />
      </div>
    </div>
  );
}

function DocumentsPreview() {
  return (
    <div className="grid grid-cols-2 gap-2 px-3 py-2.5">
      <div className="rounded-md border p-2">
        <FolderOpen className="size-4 text-emerald-500" aria-hidden="true" />
        <Line className="mt-1.5 w-3/4 bg-muted-foreground/30" />
      </div>
      <div className="rounded-md border p-2">
        <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
        <Line className="mt-1.5 w-2/3 bg-muted-foreground/30" />
      </div>
      <div className="rounded-md border p-2">
        <FolderOpen className="size-4 text-muted-foreground/70" aria-hidden="true" />
        <Line className="mt-1.5 w-3/4 bg-muted-foreground/30" />
      </div>
      <div className="rounded-md border p-2">
        <FileText className="size-4 text-emerald-500/80" aria-hidden="true" />
        <Line className="mt-1.5 w-2/3 bg-muted-foreground/30" />
      </div>
    </div>
  );
}

function SearchPreview() {
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center gap-1.5 rounded-md border px-2 py-1.5">
        <Search className="size-3 text-muted-foreground" aria-hidden="true" />
        <Line className="h-1.5 flex-1 bg-muted-foreground/15" />
        <kbd className="rounded border bg-muted px-1 font-mono text-[8px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1.5">
          <StickyNote className="size-3 text-emerald-500" aria-hidden="true" />
          <Line className="h-1.5 flex-1 bg-foreground/60" />
          <span className="text-[8px] text-muted-foreground">Note</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <ListTodo className="size-3 text-muted-foreground" aria-hidden="true" />
          <Line className="h-1.5 flex-1 bg-muted-foreground/25" />
          <span className="text-[8px] text-muted-foreground">Task</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          <CalendarDays className="size-3 text-muted-foreground" aria-hidden="true" />
          <Line className="h-1.5 flex-1 bg-muted-foreground/25" />
          <span className="text-[8px] text-muted-foreground">Event</span>
        </div>
      </div>
    </div>
  );
}

function NotificationsPreview() {
  return (
    <div className="flex flex-col gap-1.5 px-2.5 py-2.5">
      <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <Line className="h-1.5 flex-1 bg-foreground/60" />
        <span className="text-[8px] text-muted-foreground">2m</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1">
        <span className="size-1.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
        <Line className="h-1.5 flex-1 bg-muted-foreground/25" />
        <span className="text-[8px] text-muted-foreground">1h</span>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1">
        <span className="size-1.5 rounded-full bg-muted-foreground/30" aria-hidden="true" />
        <Line className="h-1.5 flex-1 bg-muted-foreground/25" />
        <span className="text-[8px] text-muted-foreground">3h</span>
      </div>
    </div>
  );
}

type Feature = {
  href?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  preview: ReactNode;
};

const features: Feature[] = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'A morning briefing that pulls your agenda, tasks, habits, and money together before you start.',
    preview: <DashboardPreview />,
  },
  {
    href: '/notes',
    icon: StickyNote,
    title: 'Notes',
    description:
      'Capture thoughts in rich, organized notes with folders and tags — a second brain in one place.',
    preview: <NotesPreview />,
  },
  {
    href: '/tasks',
    icon: ListTodo,
    title: 'Tasks',
    description: 'Projects, priorities, and due dates that turn to-dos into done.',
    preview: <TasksPreview />,
  },
  {
    href: '/calendar',
    icon: CalendarDays,
    title: 'Calendar',
    description: 'Events, reminders, and a clear view of the week so nothing sneaks up on you.',
    preview: <CalendarPreview />,
  },
  {
    href: '/habits',
    icon: Flame,
    title: 'Habits',
    description: 'Build routines you actually keep, and watch streaks grow day by day.',
    preview: <HabitsPreview />,
  },
  {
    href: '/journal',
    icon: NotebookPen,
    title: 'Journal',
    description: "Daily entries and mood tracking, so you can look back on how you've been.",
    preview: <JournalPreview />,
  },
  {
    href: '/bookmarks',
    icon: Bookmark,
    title: 'Bookmarks',
    description: 'Save links and articles, then organize them into collections worth revisiting.',
    preview: <BookmarksPreview />,
  },
  {
    href: '/finance',
    icon: Wallet,
    title: 'Finance',
    description: 'Income, expenses, and budgets in clear charts — no spreadsheet required.',
    preview: <FinancePreview />,
  },
  {
    href: '/shopping',
    icon: ShoppingCart,
    title: 'Shopping',
    description: 'Checklists organized by category, from groceries to weekend errands.',
    preview: <ShoppingPreview />,
  },
  {
    href: '/documents',
    icon: FolderOpen,
    title: 'Documents',
    description: 'Important files stored safely in your own space, sorted into folders.',
    preview: <DocumentsPreview />,
  },
  {
    icon: Search,
    title: 'Search',
    description: 'One shortcut finds anything across notes, tasks, and more — instantly.',
    preview: <SearchPreview />,
  },
  {
    href: '/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'A gentle center keeps you in the loop, without the noise.',
    preview: <NotificationsPreview />,
  },
];

function ClosingStatement() {
  return (
    <section className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center md:py-20">
        <LifeIcon className="size-8" />
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Bring your whole life into focus.
        </h2>
        <p className="max-w-xl text-muted-foreground">
          Notes, tasks, calendar, habits, money, and files — one calm home, ready when you are.
        </p>
      </div>
    </section>
  );
}
