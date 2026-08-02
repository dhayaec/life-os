'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createShoppingItem,
  deleteShoppingItem,
  updateShoppingItem,
} from '@/features/shopping/services/shopping-service';
import {
  createShoppingItemSchema,
  shoppingItemIdSchema,
  updateShoppingItemSchema,
} from '@/features/shopping/validations';

export async function createShoppingItemAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createShoppingItemSchema.parse(input);
  return handle(async () => {
    await createShoppingItem(user.id, data);
    revalidatePath('/shopping');
  });
}

export async function updateShoppingItemAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateShoppingItemSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateShoppingItem(user.id, id, rest);
    revalidatePath('/shopping');
  });
}

export async function deleteShoppingItemAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = shoppingItemIdSchema.parse(input);
  return handle(async () => {
    await deleteShoppingItem(user.id, data.id);
    revalidatePath('/shopping');
  });
}
