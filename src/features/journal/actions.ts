'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
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

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function createJournalEntryAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createJournalEntrySchema.parse(input);
  return handle(async () => {
    await createJournalEntry(user.id, data);
    revalidatePath('/journal');
  });
}

export async function updateJournalEntryAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateJournalEntrySchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateJournalEntry(user.id, id, rest);
    revalidatePath('/journal');
  });
}

export async function deleteJournalEntryAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = journalEntryIdSchema.parse(input);
  return handle(async () => {
    await deleteJournalEntry(user.id, data.id);
    revalidatePath('/journal');
  });
}
