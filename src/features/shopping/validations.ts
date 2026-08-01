import { z } from 'zod';

export const createShoppingItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  category: z.string().trim().max(100).default('Other'),
  quantity: z.number().int().min(1).max(9999).default(1),
  note: z.string().trim().max(500).nullable().optional(),
  completed: z.boolean().default(false),
});

export const updateShoppingItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name is required').max(200).optional(),
  category: z.string().trim().max(100).optional(),
  quantity: z.number().int().min(1).max(9999).optional(),
  note: z.string().trim().max(500).nullable().optional(),
  completed: z.boolean().optional(),
});

export const shoppingItemIdSchema = z.object({
  id: z.string().uuid(),
});
