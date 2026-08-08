'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createJournalEntry,
  deleteJournalEntry,
  updateJournalEntry,
} from '@/features/journal/services/journal-service';
import {
  createJournalEntrySchema,
  journalEntryIdSchema,
  updateJournalEntrySchema,
} from '@/features/journal/validations';

export async function createJournalEntryAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createJournalEntrySchema.parse(input);
    await createJournalEntry(user.id, data);
    revalidatePath('/journal');
  });
}

export async function updateJournalEntryAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateJournalEntrySchema.parse(input);
    const { id, ...rest } = data;
    await updateJournalEntry(user.id, id, rest);
    revalidatePath('/journal');
  });
}

export async function deleteJournalEntryAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = journalEntryIdSchema.parse(input);
    await deleteJournalEntry(user.id, data.id);
    revalidatePath('/journal');
  });
}
