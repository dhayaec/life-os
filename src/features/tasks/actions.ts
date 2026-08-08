'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createTask,
  deleteTask,
  toggleTask,
  updateTask,
  type TaskItem,
} from '@/features/tasks/services/task-service';
import { createTaskSchema, taskIdSchema, updateTaskSchema } from '@/features/tasks/validations';

export async function createTaskAction(input: unknown): Promise<ActionResult<TaskItem>> {
  const user = await requireUser();
  const data = createTaskSchema.parse(input);
  return handle(async () => {
    const task = await createTask(user.id, data);
    revalidatePath('/tasks');
    if (!task) throw new Error('Created task could not be loaded');
    return task;
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
