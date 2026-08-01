'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import {
  createEvent,
  deleteEvent,
  updateEvent,
} from '@/features/calendar/services/calendar-service';
import {
  createEventSchema,
  eventIdSchema,
  updateEventSchema,
} from '@/features/calendar/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function createEventAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createEventSchema.parse(input);
  return handle(async () => {
    await createEvent(user.id, data);
    revalidatePath('/calendar');
  });
}

export async function updateEventAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateEventSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateEvent(user.id, id, rest);
    revalidatePath('/calendar');
  });
}

export async function deleteEventAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = eventIdSchema.parse(input);
  return handle(async () => {
    await deleteEvent(user.id, data.id);
    revalidatePath('/calendar');
  });
}
