'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import type { HabitFrequency } from '@/features/habits/services/habit-service';

export type HabitInitial = {
  id: string | null;
  name: string;
  frequency: HabitFrequency;
};

const frequencies: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function HabitFormDialog({
  initial,
  open,
  onClose,
}: {
  initial: HabitInitial | null;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(initial?.frequency ?? 'daily');
  const { enqueue } = useSyncMutation('habits');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const payload = { name: name.trim(), frequency };
    if (isEdit) {
      void enqueue('update', {
        id: current.id,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } else {
      void enqueue('create', {
        id: crypto.randomUUID(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entries: [],
      });
    }
    onClose();
  }

  function handleDelete() {
    if (!current.id) return;
    void enqueue('delete', { id: current.id, deletedAt: new Date().toISOString() });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit habit' : 'New habit'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Drink water"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="habit-frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(value) => setFrequency(value as HabitFrequency)}
            >
              <SelectTrigger id="habit-frequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
