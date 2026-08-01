'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import {
  createBookmark,
  createCollection,
  deleteBookmark,
  deleteCollection,
  updateBookmark,
} from '@/features/bookmarks/services/bookmark-service';
import {
  bookmarkIdSchema,
  collectionIdSchema,
  createBookmarkSchema,
  createCollectionSchema,
  updateBookmarkSchema,
} from '@/features/bookmarks/validations';

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

async function handle<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Something went wrong' };
  }
}

export async function createBookmarkAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createBookmarkSchema.parse(input);
  return handle(async () => {
    await createBookmark(user.id, data);
    revalidatePath('/bookmarks');
  });
}

export async function updateBookmarkAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateBookmarkSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateBookmark(user.id, id, rest);
    revalidatePath('/bookmarks');
  });
}

export async function deleteBookmarkAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = bookmarkIdSchema.parse(input);
  return handle(async () => {
    await deleteBookmark(user.id, data.id);
    revalidatePath('/bookmarks');
  });
}

export async function createCollectionAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createCollectionSchema.parse(input);
  return handle(async () => {
    await createCollection(user.id, data);
    revalidatePath('/bookmarks');
  });
}

export async function deleteCollectionAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = collectionIdSchema.parse(input);
  return handle(async () => {
    await deleteCollection(user.id, data.id);
    revalidatePath('/bookmarks');
  });
}
