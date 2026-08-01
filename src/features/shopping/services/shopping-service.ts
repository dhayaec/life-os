import 'server-only';

import { db } from '@/server/db';
import type { Prisma, ShoppingItem as ShoppingItemRecord } from '@/generated/prisma/client';

export type ShoppingItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  note: string | null;
  completed: boolean;
  createdAt: string;
};

export type ShoppingGroup = {
  category: string;
  items: ShoppingItem[];
};

function serializeItem(item: ShoppingItemRecord): ShoppingItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    note: item.note,
    completed: item.completed,
    createdAt: item.createdAt.toISOString(),
  };
}

export type CreateShoppingItemInput = {
  name: string;
  category: string;
  quantity: number;
  note?: string | null | undefined;
  completed?: boolean | undefined;
};

export type UpdateShoppingItemInput = {
  name?: string | undefined;
  category?: string | undefined;
  quantity?: number | undefined;
  note?: string | null | undefined;
  completed?: boolean | undefined;
};

export async function getShoppingItems(
  userId: string,
  category?: string | null
): Promise<{ items: ShoppingItem[]; categories: string[] }> {
  const records = await db.shoppingItem.findMany({
    where: {
      userId,
      ...(category ? { category } : {}),
    },
    orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }],
  });

  const allCategories = await db.shoppingItem.findMany({
    where: { userId },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  return {
    items: records.map(serializeItem),
    categories: allCategories.map((row) => row.category),
  };
}

export async function createShoppingItem(
  userId: string,
  input: CreateShoppingItemInput
): Promise<ShoppingItem> {
  const data: Prisma.ShoppingItemUncheckedCreateInput = {
    userId,
    name: input.name,
    category: input.category || 'Other',
    quantity: input.quantity,
    note: input.note ?? null,
    completed: input.completed ?? false,
  };
  const item = await db.shoppingItem.create({ data });
  return serializeItem(item);
}

export async function updateShoppingItem(
  userId: string,
  id: string,
  input: UpdateShoppingItemInput
): Promise<ShoppingItem> {
  const data: Prisma.ShoppingItemUncheckedUpdateInput = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
    ...(input.completed !== undefined ? { completed: input.completed } : {}),
  };
  const item = await db.shoppingItem.update({
    where: { id, userId },
    data,
  });
  return serializeItem(item);
}

export async function deleteShoppingItem(userId: string, id: string): Promise<void> {
  await db.shoppingItem.delete({ where: { id, userId } });
}
