import { describe, expect, it } from 'vitest';

import { createTaskSchema } from '@/features/tasks/validations';
import { createNoteSchema } from '@/features/notes/validations';
import { createHabitSchema, setHabitEntrySchema } from '@/features/habits/validations';
import { createBudgetSchema, createTransactionSchema } from '@/features/finance/validations';
import { createShoppingItemSchema } from '@/features/shopping/validations';

const UUID = '00000000-0000-4000-8000-000000000000';

describe('task validations', () => {
  it('accepts a minimal task', () => {
    expect(createTaskSchema.safeParse({ title: 'Ship feature' }).success).toBe(true);
  });

  it('rejects empty or whitespace-only titles', () => {
    expect(createTaskSchema.safeParse({ title: '' }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('rejects unknown status and priority values', () => {
    expect(createTaskSchema.safeParse({ title: 'x', status: 'blocked' }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: 'x', priority: 'urgent' }).success).toBe(false);
  });
});

describe('note validations', () => {
  it('applies defaults for title, content, and tags', () => {
    const result = createNoteSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Untitled');
      expect(result.data.content).toBe('');
      expect(result.data.tagNames).toEqual([]);
    }
  });

  it('rejects a non-uuid folderId', () => {
    expect(createNoteSchema.safeParse({ folderId: 'not-a-uuid' }).success).toBe(false);
  });
});

describe('habit validations', () => {
  it('rejects an unknown frequency', () => {
    expect(createHabitSchema.safeParse({ name: 'Read', frequency: 'yearly' }).success).toBe(false);
  });

  it('enforces the YYYY-MM-DD entry date format', () => {
    const valid = setHabitEntrySchema.safeParse({ habitId: UUID, date: '2026-08-01', done: true });
    expect(valid.success).toBe(true);
    expect(
      setHabitEntrySchema.safeParse({ habitId: UUID, date: '08/01/2026', done: true }).success
    ).toBe(false);
  });
});

describe('finance validations', () => {
  it('requires a positive amount', () => {
    expect(
      createTransactionSchema.safeParse({ amount: -5, category: 'Food', date: '2026-08-01' })
        .success
    ).toBe(false);
    expect(
      createTransactionSchema.safeParse({ amount: 0, category: 'Food', date: '2026-08-01' }).success
    ).toBe(false);
  });

  it('rejects an invalid transaction type', () => {
    expect(
      createTransactionSchema.safeParse({
        amount: 10,
        type: 'refund',
        category: 'Food',
        date: '2026-08-01',
      }).success
    ).toBe(false);
  });

  it('validates the budget month format', () => {
    expect(
      createBudgetSchema.safeParse({ category: 'Rent', amount: 1200, month: '2026-08' }).success
    ).toBe(true);
    expect(
      createBudgetSchema.safeParse({ category: 'Rent', amount: 1200, month: '2026-8' }).success
    ).toBe(false);
  });
});

describe('shopping validations', () => {
  it('applies defaults for category, quantity, and completed', () => {
    const result = createShoppingItemSchema.safeParse({ name: 'Milk' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('Other');
      expect(result.data.quantity).toBe(1);
      expect(result.data.completed).toBe(false);
    }
  });

  it('rejects a fractional quantity', () => {
    expect(createShoppingItemSchema.safeParse({ name: 'Milk', quantity: 1.5 }).success).toBe(false);
  });
});
