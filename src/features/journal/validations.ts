import { z } from 'zod';

export const journalMoodSchema = z.enum(['terrible', 'bad', 'okay', 'good', 'great']);

export const createJournalEntrySchema = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  content: z.string().trim().min(1).max(50000),
  mood: journalMoodSchema.optional(),
  entryAt: z.string().datetime().optional(),
});

export const updateJournalEntrySchema = createJournalEntrySchema
  .partial()
  .extend({ id: z.string().uuid() });

export const journalEntryIdSchema = z.object({
  id: z.string().uuid(),
});
