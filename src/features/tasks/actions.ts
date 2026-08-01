'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import {
  createTask,
  deleteTask,
  toggleTask,
  updateTask,
} from '@/features/tasks/services/task-service';
import { createTaskSchema, taskIdSchema, updateTaskSchema } from '@/features/tasks/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function createTaskAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createTaskSchema.parse(input);
  return handle(async () => {
    await createTask(user.id, data);
    revalidatePath('/tasks');
  });
}

export async function updateTaskAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateTaskSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateTask(user.id, id, rest);
    revalidatePath('/tasks');
  });
}

export async function deleteTaskAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = taskIdSchema.parse(input);
  return handle(async () => {
    await deleteTask(user.id, data.id);
    revalidatePath('/tasks');
  });
}

export async function toggleTaskAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = taskIdSchema.parse(input);
  return handle(async () => {
    await toggleTask(user.id, data.id);
    revalidatePath('/tasks');
  });
}
