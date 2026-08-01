'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import {
  deleteDocument,
  restoreDocument,
  toggleDocumentFavorite,
  trashDocument,
} from '@/features/documents/services/documents-service';
import { documentIdSchema } from '@/features/documents/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function toggleDocumentFavoriteAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = documentIdSchema.parse(input);
  return handle(async () => {
    await toggleDocumentFavorite(user.id, data.id);
    revalidatePath('/documents');
    revalidatePath('/documents/trash');
  });
}

export async function trashDocumentAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = documentIdSchema.parse(input);
  return handle(async () => {
    await trashDocument(user.id, data.id);
    revalidatePath('/documents');
    revalidatePath('/documents/trash');
  });
}

export async function restoreDocumentAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = documentIdSchema.parse(input);
  return handle(async () => {
    await restoreDocument(user.id, data.id);
    revalidatePath('/documents');
    revalidatePath('/documents/trash');
  });
}

export async function deleteDocumentAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = documentIdSchema.parse(input);
  return handle(async () => {
    await deleteDocument(user.id, data.id);
    revalidatePath('/documents');
    revalidatePath('/documents/trash');
  });
}
