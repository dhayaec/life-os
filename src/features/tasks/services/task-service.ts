import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  labels: { id: string; name: string; color: string }[];
};

export type LabelItem = { id: string; name: string; color: string };

type TaskWithLabels = Prisma.TaskGetPayload<{
  include: { labels: { include: { label: true } } };
}>;

export function serializeTask(task: TaskWithLabels): TaskItem {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    labels: task.labels.map(({ label }) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
  };
}

export type TaskListOptions = {
  status?: TaskStatus;
  priority?: TaskPriority;
  label?: string;
  search?: string;
};

export async function getTasks(userId: string, options: TaskListOptions = {}) {
  const where: Prisma.TaskWhereInput = {
    userId,
    ...(options.status ? { status: options.status } : {}),
    ...(options.priority ? { priority: options.priority } : {}),
    ...(options.label ? { labels: { some: { label: { name: options.label } } } } : {}),
    ...(options.search
      ? {
          OR: [
            { title: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const tasks = await db.task.findMany({
    where,
    include: { labels: { include: { label: true } } },
    take: 200,
    orderBy: [
      { completedAt: { sort: 'asc', nulls: 'first' } },
      { dueAt: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ],
  });

  return tasks.map(serializeTask);
}

export async function getTask(userId: string, id: string) {
  const task = await db.task.findFirst({
    where: { id, userId },
    include: { labels: { include: { label: true } } },
  });
  return task ? serializeTask(task) : null;
}

export async function getLabels(userId: string): Promise<LabelItem[]> {
  const labels = await db.label.findMany({ where: { userId }, orderBy: { name: 'asc' } });
  return labels.map((label) => ({ id: label.id, name: label.name, color: label.color }));
}

export type TaskInput = {
  title: string;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  dueAt?: string | null | undefined;
  labelNames?: string[] | undefined;
};

export type TaskUpdateInput = {
  title?: string | undefined;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  dueAt?: string | null | undefined;
  labelNames?: string[] | undefined;
};

export async function setLabels(
  client: Prisma.TransactionClient,
  userId: string,
  taskId: string,
  labelNames: string[]
) {
  await client.taskLabel.deleteMany({ where: { taskId } });

  for (const name of labelNames) {
    const label = await client.label.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name },
    });
    await client.taskLabel.upsert({
      where: { taskId_labelId: { taskId, labelId: label.id } },
      update: {},
      create: { taskId, labelId: label.id },
    });
  }
}

export async function createTask(userId: string, input: TaskInput) {
  const task = await db.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      completedAt: input.status === 'done' ? new Date() : null,
    },
  });

  if (input.labelNames?.length) {
    await setLabels(db, userId, task.id, input.labelNames);
  }

  return getTask(userId, task.id);
}

export async function updateTask(userId: string, id: string, input: TaskUpdateInput) {
  const existing = await db.task.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.TaskUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt ? new Date(input.dueAt) : null;

  const nextStatus = input.status ?? existing.status;
  if (input.status !== undefined) {
    if (nextStatus === 'done' && !existing.completedAt) data.completedAt = new Date();
    if (nextStatus !== 'done') data.completedAt = null;
  }

  if (Object.keys(data).length > 0) {
    await db.task.update({ where: { id }, data });
  }

  if (input.labelNames !== undefined) {
    await setLabels(db, userId, id, input.labelNames);
  }

  return getTask(userId, id);
}

export async function toggleTask(userId: string, id: string) {
  const task = await db.task.findFirst({ where: { id, userId } });
  if (!task) return null;
  const done = task.status !== 'done';
  return db.task.update({
    where: { id },
    data: {
      status: done ? 'done' : 'todo',
      completedAt: done ? new Date() : null,
    },
  });
}

export async function deleteTask(userId: string, id: string) {
  return db.task.delete({ where: { id, userId } });
}
