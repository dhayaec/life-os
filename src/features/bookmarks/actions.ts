'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
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

export async function createBookmarkAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createBookmarkSchema.parse(input);
    await createBookmark(user.id, data);
    revalidatePath('/bookmarks');
  });
}

export async function updateBookmarkAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateBookmarkSchema.parse(input);
    const { id, ...rest } = data;
    await updateBookmark(user.id, id, rest);
    revalidatePath('/bookmarks');
  });
}

export async function deleteBookmarkAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = bookmarkIdSchema.parse(input);
    await deleteBookmark(user.id, data.id);
    revalidatePath('/bookmarks');
  });
}

export async function createCollectionAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createCollectionSchema.parse(input);
    await createCollection(user.id, data);
    revalidatePath('/bookmarks');
  });
}

export async function deleteCollectionAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = collectionIdSchema.parse(input);
    await deleteCollection(user.id, data.id);
    revalidatePath('/bookmarks');
  });
}
