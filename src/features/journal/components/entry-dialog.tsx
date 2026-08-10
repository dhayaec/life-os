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
import { Textarea } from '@/components/ui/textarea';
import { useSyncMutation } from '@/hooks/use-sync-mutation';
import type { JournalMood } from '@/features/journal/services/journal-service';

export type EntryInitial = {
  id: string | null;
  title: string;
  content: string;
  mood: JournalMood;
  entryAt: string;
};

const moods: { value: JournalMood; label: string }[] = [
  { value: 'terrible', label: 'Terrible' },
  { value: 'bad', label: 'Bad' },
  { value: 'okay', label: 'Okay' },
  { value: 'good', label: 'Good' },
  { value: 'great', label: 'Great' },
];

export function EntryDialog({
  initial,
  open,
  onClose,
}: {
  initial: EntryInitial | null;
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [mood, setMood] = useState<JournalMood>(initial?.mood ?? 'okay');
  const [entryDate, setEntryDate] = useState(initial ? toDateInputValue(initial.entryAt) : '');
  const [entryTime, setEntryTime] = useState(initial ? toTimeInputValue(initial.entryAt) : '');
  const { enqueue } = useSyncMutation('journalEntries');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      toast.error('Entry content is required');
      return;
    }
    const entryAt = new Date(`${entryDate}T${entryTime || '09:00'}`).toISOString();
    const payload = {
      title: title.trim() || null,
      content: content.trim(),
      mood,
      entryAt,
    };
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
            <DialogTitle>{isEdit ? 'Edit entry' : 'New entry'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A good day"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-date">Date</Label>
              <Input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="entry-time">Time</Label>
              <Input
                id="entry-time"
                type="time"
                value={entryTime}
                onChange={(event) => setEntryTime(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-mood">Mood</Label>
            <Select value={mood} onValueChange={(value) => setMood(value as JournalMood)}>
              <SelectTrigger id="entry-mood" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moods.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-content">Content</Label>
            <Textarea
              id="entry-content"
              rows={6}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
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

function toDateInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
