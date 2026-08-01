'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from '@/features/calendar/actions';

export type EventInitial = {
  id: string | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  location: string | null;
  color: string;
};

const colors = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#ec4899'];

export function EventDialog({
  initial,
  open,
  onClose,
}: {
  initial: EventInitial | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(
    initial?.startAt ? toDateInputValue(initial.startAt) : ''
  );
  const [startTime, setStartTime] = useState(
    initial?.startAt ? toTimeInputValue(initial.startAt) : ''
  );
  const [hasEnd, setHasEnd] = useState(Boolean(initial?.endAt));
  const [endDate, setEndDate] = useState(initial?.endAt ? toDateInputValue(initial.endAt) : '');
  const [endTime, setEndTime] = useState(initial?.endAt ? toTimeInputValue(initial.endAt) : '');
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [location, setLocation] = useState(initial?.location ?? '');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !startDate) {
      toast.error('Title and start date are required');
      return;
    }
    const startAt = allDay
      ? new Date(`${startDate}T00:00:00`).toISOString()
      : new Date(`${startDate}T${startTime || '09:00'}`).toISOString();
    const endAt =
      hasEnd && endDate ? new Date(`${endDate}T${endTime || '00:00'}`).toISOString() : null;
    const payload = {
      title: title.trim(),
      description: description || null,
      startAt,
      endAt,
      allDay,
      location: location || null,
      color,
    };
    const result = isEdit
      ? await updateEventAction({ id: current.id, ...payload })
      : await createEventAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!current.id) return;
    const result = await deleteEventAction({ id: current.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="event-allday" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="event-allday">All day</Label>
          </div>
          {allDay ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event-start-date">Date</Label>
              <Input
                id="event-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-start-date">Start date</Label>
                <Input
                  id="event-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-start-time">Start time</Label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="event-has-end" checked={hasEnd} onCheckedChange={setHasEnd} />
            <Label htmlFor="event-has-end">End time</Label>
          </div>
          {hasEnd ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-end-date">End date</Label>
                <Input
                  id="event-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-end-time">End time</Label>
                <Input
                  id="event-end-time"
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Color</Label>
            <div className="flex gap-2">
              {colors.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  aria-label={`Color ${item}`}
                  aria-pressed={color === item}
                  className={`size-6 rounded-full ${
                    color === item ? 'ring-ring ring-2 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: item }}
                />
              ))}
            </div>
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
