import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  Flame,
  ListTodo,
  NotebookPen,
  StickyNote,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { requireUser } from '@/server/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { getDashboardData } from '@/features/dashboard/services/dashboard-service';
import { getLocale } from '@/features/settings/services/settings-service';
import { BriefingCard } from '@/features/ai/components/briefing-card';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const locale = await getLocale(user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm">{data.todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction href="/notes" label="Note" icon={StickyNote} />
          <QuickAction href="/tasks" label="Task" icon={ListTodo} />
          <QuickAction href="/calendar" label="Event" icon={CalendarDays} />
          <QuickAction href="/journal" label="Journal" icon={NotebookPen} />
          <QuickAction href="/finance" label="Transaction" icon={Wallet} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="Due tasks"
          value={String(data.dueTasks.length)}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={Flame}
          label="Top streak"
          value={`${data.habitStreaks[0]?.currentStreak ?? 0}d`}
          color="text-orange-600 dark:text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatCard
          icon={StickyNote}
          label="Recent notes"
          value={String(data.recentNotes.length)}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          icon={Wallet}
          label="Balance"
          value={currency(data.finance.balance, locale)}
          color={
            data.finance.balance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }
          bg={data.finance.balance >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <BriefingCard
            snapshot={{
              agenda: data.agendaEvents.map((e) => ({ title: e.title, startAt: e.startAt })),
              tasksDue: data.dueTasks.map((t) => ({ title: t.title, dueAt: t.dueAt })),
              habits: data.habitStreaks.map((h) => ({ name: h.name, streak: h.currentStreak })),
              recentNotes: data.recentNotes.map((n) => ({
                title: n.title,
                updatedAt: n.updatedAt,
              })),
              finance: { balance: data.finance.balance, expense: data.finance.expense },
            }}
          />
        </div>
        <AgendaCard events={data.agendaEvents} tasks={data.agendaTasks} />
        <FinanceCard
          income={data.finance.income}
          expense={data.finance.expense}
          balance={data.finance.balance}
          locale={locale}
        />
        <DueTasksCard tasks={data.dueTasks} />
        <UpcomingEventsCard events={data.upcomingEvents} />
        <RecentNotesCard notes={data.recentNotes} />
        <HabitStreaksCard streaks={data.habitStreaks} />
      </div>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

type EventRow = { id: string; title: string; startAt: string; allDay: boolean; color: string };
type TaskRow = { id: string; title: string; status: string; dueAt: string | null };

function AgendaCard({ events, tasks }: { events: EventRow[]; tasks: TaskRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="size-4" />
          Today
        </CardTitle>
        <Link href="/calendar" className="text-muted-foreground text-xs hover:underline">
          View calendar
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.length === 0 && tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing scheduled today.</p>
        ) : null}
        {events.map((event) => (
          <div key={`e-${event.id}`} className="flex items-center gap-2 text-sm">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <span className="truncate font-medium">{event.title}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs">
              {event.allDay ? 'All day' : timeLabel(event.startAt)}
            </span>
          </div>
        ))}
        {tasks.map((task) => (
          <div key={`t-${task.id}`} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="text-muted-foreground size-4 shrink-0" />
            <span className="truncate">{task.title}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs">Due today</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinanceCard({
  income,
  expense,
  balance,
  locale,
}: {
  income: number;
  expense: number;
  balance: number;
  locale: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="size-4" />
          Finance
        </CardTitle>
        <Link href="/finance" className="text-muted-foreground text-xs hover:underline">
          This month
        </Link>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Stat label="Income" value={currency(income, locale)} className="text-emerald-600" />
          <Stat label="Expenses" value={currency(expense, locale)} className="text-red-600" />
        </div>
        <div className="min-w-0 overflow-hidden text-right">
          <div className="text-muted-foreground text-xs font-medium uppercase">Balance</div>
          <div
            className={`${valueSize(currency(balance, locale))} truncate font-semibold ${
              balance < 0 ? 'text-red-600' : ''
            }`}
          >
            {currency(balance, locale)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DueTasksCard({ tasks }: { tasks: TaskRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ListTodo className="size-4" />
          Due soon
        </CardTitle>
        <Link href="/tasks" className="text-muted-foreground text-xs hover:underline">
          All tasks
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No overdue or due-soon tasks.</p>
        ) : (
          tasks.slice(0, 5).map((task) => {
            const overdue = isOverdue(task.dueAt);
            return (
              <div key={task.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`truncate ${task.status === 'in_progress' ? 'text-amber-600' : ''}`}
                >
                  {task.title}
                </span>
                <span
                  className={`ml-auto shrink-0 text-xs ${
                    overdue ? 'text-red-600' : 'text-muted-foreground'
                  }`}
                >
                  {task.dueAt ? (overdue ? 'Overdue' : dueLabel(task.dueAt)) : 'No date'}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function UpcomingEventsCard({ events }: { events: EventRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="size-4" />
          Upcoming events
        </CardTitle>
        <Link href="/calendar" className="text-muted-foreground text-xs hover:underline">
          View calendar
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming events.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center gap-2 text-sm">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: event.color }}
              />
              <span className="truncate">{event.title}</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {whenLabel(event.startAt)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentNotesCard({ notes }: { notes: { id: string; title: string; updatedAt: string }[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <StickyNote className="size-4" />
          Recent notes
        </CardTitle>
        <Link href="/notes" className="text-muted-foreground text-xs hover:underline">
          All notes
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No notes yet. Create your first one.</p>
        ) : (
          notes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="flex items-center gap-2 text-sm hover:underline"
            >
              <FilePlus2 className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate font-medium">{note.title}</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {timeAgo(note.updatedAt)}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function HabitStreaksCard({
  streaks,
}: {
  streaks: { id: string; name: string; currentStreak: number }[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="size-4" />
          Habit streaks
        </CardTitle>
        <Link href="/habits" className="text-muted-foreground text-xs hover:underline">
          All habits
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {streaks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No habits yet. Start tracking one.</p>
        ) : (
          streaks.map((streak) => (
            <div key={streak.id} className="flex items-center gap-2 text-sm">
              <Flame
                className={`size-4 shrink-0 ${
                  streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
                }`}
              />
              <span className="truncate">{streak.name}</span>
              <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-6 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${className ?? ''}`}>{value}</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className={`${valueSize(value)} truncate font-semibold`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

/** Shrink the value font so long strings (e.g. large currency) fit the card. */
function valueSize(value: string) {
  if (value.length <= 5) return 'text-2xl';
  if (value.length <= 9) return 'text-xl';
  if (value.length <= 13) return 'text-lg';
  if (value.length <= 17) return 'text-base';
  return 'text-sm';
}

function isOverdue(dueAt: string | null): boolean {
  return dueAt !== null && new Date(dueAt).getTime() < Date.now();
}

function currency(value: number, locale: string) {
  return formatCurrency(value, locale);
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function whenLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function dueLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
