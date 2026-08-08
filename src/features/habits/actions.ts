'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createHabit,
  deleteHabit,
  setHabitEntry,
  updateHabit,
} from '@/features/habits/services/habit-service';
import {
  createHabitSchema,
  habitIdSchema,
  setHabitEntrySchema,
  updateHabitSchema,
} from '@/features/habits/validations';

export async function createHabitAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createHabitSchema.parse(input);
    await createHabit(user.id, data);
    revalidatePath('/habits');
  });
}

export async function updateHabitAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateHabitSchema.parse(input);
    const { id, ...rest } = data;
    await updateHabit(user.id, id, rest);
    revalidatePath('/habits');
  });
}

export async function deleteHabitAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = habitIdSchema.parse(input);
    await deleteHabit(user.id, data.id);
    revalidatePath('/habits');
  });
}

export async function setHabitEntryAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = setHabitEntrySchema.parse(input);
    await setHabitEntry(user.id, data.habitId, data.date, data.done);
    revalidatePath('/habits');
  });
}
