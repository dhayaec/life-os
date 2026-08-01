import { z } from 'zod';

export const habitFrequencySchema = z.enum(['daily', 'weekly', 'monthly']);

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  frequency: habitFrequencySchema.optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  id: z.string().uuid(),
});

export const habitIdSchema = z.object({
  id: z.string().uuid(),
});

export const setHabitEntrySchema = z.object({
  habitId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  done: z.boolean(),
});
