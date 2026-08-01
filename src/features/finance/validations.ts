import { z } from 'zod';

export const transactionTypeSchema = z.enum(['income', 'expense']);

export const createTransactionSchema = z.object({
  amount: z.number().positive(),
  type: transactionTypeSchema.optional(),
  category: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(500).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial().extend({
  id: z.string().uuid(),
});

export const transactionIdSchema = z.object({
  id: z.string().uuid(),
});

export const createBudgetSchema = z.object({
  category: z.string().trim().min(1).max(100),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const updateBudgetSchema = createBudgetSchema.partial().extend({
  id: z.string().uuid(),
});

export const budgetIdSchema = z.object({
  id: z.string().uuid(),
});
