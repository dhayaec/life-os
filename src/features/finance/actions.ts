'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/server/session';
import { handle, type ActionResult } from '@/server/action-result';
import {
  createBudget,
  createTransaction,
  deleteBudget,
  deleteTransaction,
  updateBudget,
  updateTransaction,
} from '@/features/finance/services/finance-service';
import {
  budgetIdSchema,
  createBudgetSchema,
  createTransactionSchema,
  transactionIdSchema,
  updateBudgetSchema,
  updateTransactionSchema,
} from '@/features/finance/validations';

export async function createTransactionAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createTransactionSchema.parse(input);
  return handle(async () => {
    await createTransaction(user.id, data);
    revalidatePath('/finance');
  });
}

export async function updateTransactionAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateTransactionSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateTransaction(user.id, id, rest);
    revalidatePath('/finance');
  });
}

export async function deleteTransactionAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = transactionIdSchema.parse(input);
  return handle(async () => {
    await deleteTransaction(user.id, data.id);
    revalidatePath('/finance');
  });
}

export async function createBudgetAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = createBudgetSchema.parse(input);
  return handle(async () => {
    await createBudget(user.id, data);
    revalidatePath('/finance');
  });
}

export async function updateBudgetAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = updateBudgetSchema.parse(input);
  return handle(async () => {
    const { id, ...rest } = data;
    await updateBudget(user.id, id, rest);
    revalidatePath('/finance');
  });
}

export async function deleteBudgetAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const data = budgetIdSchema.parse(input);
  return handle(async () => {
    await deleteBudget(user.id, data.id);
    revalidatePath('/finance');
  });
}
