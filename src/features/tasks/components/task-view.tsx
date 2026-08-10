'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { TaskComposer } from '@/features/tasks/components/task-composer';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { TaskList } from '@/features/tasks/components/task-list';
import type { TaskItem } from '@/features/tasks/services/task-service';

import { useLocalQuery } from '@/hooks/use-local-query';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import { syncEngine } from '@/lib/sync/engine';
import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

const statuses = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export function TaskView({
  tasks: initialTasks,
  initialStatus,
  initialSearch,
}: {
  tasks: TaskItem[];
  initialStatus: string;
  initialSearch: string;
}) {
  useRouteLoadedSignal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const { rows, hydrated } = useLocalQuery<TaskItem>(
    'tasks',
    (all) => selectTasks(all, initialStatus, search),
    [initialStatus, search]
  );
  const { enqueue } = useSyncMutation('tasks');

  useEffect(() => {
    void syncEngine.hydrateSeed('tasks', initialTasks);
  }, [initialTasks]);

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set('status', value);
    else params.delete('status');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set('search', search.trim());
    else params.delete('search');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleCreated(task: TaskItem) {
    void enqueue('create', task);
  }

  function handleToggle(task: TaskItem) {
    if (pending === task.id) return;
    setPending(task.id);
    const next = task.status === 'done' ? 'todo' : 'done';
    void enqueue('update', {
      id: task.id,
      status: next,
      completedAt: next === 'done' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  function handleDelete(task: TaskItem) {
    if (pending === task.id) return;
    setPending(task.id);
    void enqueue('delete', {
      id: task.id,
      deletedAt: new Date().toISOString(),
    }).finally(() => setPending(null));
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Tasks" />
        <div className="flex flex-col gap-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tasks" />
      <TaskComposer onCreated={handleCreated} />
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setStatus(item.value)}
            aria-pressed={initialStatus === item.value}
            className={`rounded-full px-3 py-1 text-sm ${
              initialStatus === item.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
        <form onSubmit={handleSearch} className="relative ml-auto max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="bg-muted/40 h-8 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>
      </div>
      <TaskList
        tasks={rows ?? []}
        pending={pending}
        onEdit={setEditing}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <TaskEditor
        key={editing?.id ?? 'none'}
        task={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function selectTasks(tasks: TaskItem[], status: string, search: string): TaskItem[] {
  let result = tasks;
  if (status) result = result.filter((task) => task.status === status);
  if (search) {
    const query = search.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        (task.description ?? '').toLowerCase().includes(query)
    );
  }
  return [...result].sort((a, b) => {
    if (a.completedAt !== b.completedAt) {
      if (!a.completedAt) return -1;
      if (!b.completedAt) return 1;
      return a.completedAt < b.completedAt ? -1 : 1;
    }
    if (a.dueAt !== b.dueAt) {
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt < b.dueAt ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}
