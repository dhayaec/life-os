'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TaskItem } from '@/features/tasks/services/task-service';

export function TaskComposer({ onCreated }: { onCreated: (task: TaskItem) => void }) {
  const [title, setTitle] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreated({
      id: crypto.randomUUID(),
      title: trimmed,
      description: null,
      status: 'todo',
      priority: 'medium',
      dueAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      labels: [],
    });
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task…"
        aria-label="Task title"
        className="h-9"
      />
      <Button type="submit" size="sm">
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}
