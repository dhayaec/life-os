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
  return handle(async () => {
    const user = await requireUser();
    const data = createTransactionSchema.parse(input);
    await createTransaction(user.id, data);
    revalidatePath('/finance');
  });
}

export async function updateTransactionAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateTransactionSchema.parse(input);
    const { id, ...rest } = data;
    await updateTransaction(user.id, id, rest);
    revalidatePath('/finance');
  });
}

export async function deleteTransactionAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = transactionIdSchema.parse(input);
    await deleteTransaction(user.id, data.id);
    revalidatePath('/finance');
  });
}

export async function createBudgetAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = createBudgetSchema.parse(input);
    await createBudget(user.id, data);
    revalidatePath('/finance');
  });
}

export async function updateBudgetAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = updateBudgetSchema.parse(input);
    const { id, ...rest } = data;
    await updateBudget(user.id, id, rest);
    revalidatePath('/finance');
  });
}

export async function deleteBudgetAction(input: unknown): Promise<ActionResult> {
  return handle(async () => {
    const user = await requireUser();
    const data = budgetIdSchema.parse(input);
    await deleteBudget(user.id, data.id);
    revalidatePath('/finance');
  });
}
