'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { TaskComposer } from '@/features/tasks/components/task-composer';
import { TaskEditor } from '@/features/tasks/components/task-editor';
import { TaskList } from '@/features/tasks/components/task-list';
import type { TaskItem } from '@/features/tasks/services/task-service';

import { useRouteLoadedSignal } from '@/providers/route-loader-provider';

const statuses = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export function TaskView({
  tasks,
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

  return (
    <div className="flex flex-col gap-4">
      <TaskComposer />
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
      <TaskList tasks={tasks} onEdit={setEditing} />
      <TaskEditor
        key={editing?.id ?? 'none'}
        task={editing}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
