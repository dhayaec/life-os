import { z } from 'zod';

export const eventColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color');

export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().max(2000).nullable().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  location: z.string().trim().max(300).nullable().optional(),
  color: eventColorSchema.optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({ id: z.string().uuid() });

export const eventIdSchema = z.object({ id: z.string().uuid() });
