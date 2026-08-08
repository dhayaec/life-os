'use client';

import { Trash2 } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import type { TaskItem } from '@/features/tasks/services/task-service';

const priorityStyles: Record<TaskItem['priority'], string> = {
  low: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  high: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export function TaskList({
  tasks,
  pending,
  onEdit,
  onToggle,
  onDelete,
}: {
  tasks: TaskItem[];
  pending: string | null;
  onEdit: (task: TaskItem) => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}) {
  if (tasks.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No tasks yet. Add one above.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {tasks.map((task) => {
        const done = task.status === 'done';
        const overdue = !done && task.dueAt !== null && new Date(task.dueAt) < new Date();
        return (
          <li key={task.id} className="group flex items-center gap-3 rounded-md border px-3 py-2">
            <Checkbox
              checked={done}
              disabled={pending === task.id}
              onCheckedChange={() => onToggle(task)}
              aria-label={done ? 'Mark incomplete' : 'Mark complete'}
            />
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="flex flex-1 flex-col items-start gap-0.5 text-left"
            >
              <span className={`text-sm ${done ? 'text-muted-foreground line-through' : ''}`}>
                {task.title}
              </span>
              {task.labels.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1">
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]"
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
            <div className="flex shrink-0 items-center gap-1.5">
              {task.dueAt ? (
                <span
                  suppressHydrationWarning
                  className={`text-xs ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}
                >
                  {overdue ? <span className="sr-only">Overdue — </span> : null}
                  {formatDue(task.dueAt)}
                </span>
              ) : null}
              <span className={`rounded-full px-2 py-0.5 text-xs ${priorityStyles[task.priority]}`}>
                {task.priority}
              </span>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={pending === task.id}
                className="text-muted-foreground hover:text-destructive rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-0"
                aria-label="Delete task"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function formatDue(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
