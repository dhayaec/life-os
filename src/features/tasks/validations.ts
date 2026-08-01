import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueAt: z.string().nullable().optional(),
  labelNames: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({ id: z.string().uuid() });

export const taskIdSchema = z.object({ id: z.string().uuid() });
