'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
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

export async function createEventAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createEventSchema.parse(input);
    await createEvent(user.id, data);
    revalidatePath('/calendar');
  });
}

export async function updateEventAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateEventSchema.parse(input);
    const { id, ...rest } = data;
    await updateEvent(user.id, id, rest);
    revalidatePath('/calendar');
  });
}

export async function deleteEventAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = eventIdSchema.parse(input);
    await deleteEvent(user.id, data.id);
    revalidatePath('/calendar');
  });
}
