'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTaskAction } from '@/features/tasks/actions';

export function TaskComposer() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    const result = await createTaskAction({ title: trimmed });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setTitle('');
    router.refresh();
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
      <Button type="submit" size="sm" disabled={pending}>
        <Plus className="size-4" />
        Add
      </Button>
    </form>
  );
}
