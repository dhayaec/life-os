import 'server-only';

import type { FinanceTransaction, Prisma } from '@/generated/prisma/client';
import { db } from '@/server/db';

export type TransactionTypeLiteral = 'income' | 'expense';

export type TransactionItem = {
  id: string;
  amount: number;
  type: TransactionTypeLiteral;
  category: string;
  date: string;
  note: string | null;
};

export type CategoryTotal = {
  category: string;
  amount: number;
};

export type MonthlySummary = {
  income: number;
  expense: number;
  balance: number;
  byCategory: CategoryTotal[];
};

export type BudgetItem = {
  id: string;
  category: string;
  amount: number;
  month: string;
  spent: number;
};

type TransactionRow = FinanceTransaction;

function serializeTransaction(tx: TransactionRow): TransactionItem {
  return {
    id: tx.id,
    amount: Number(tx.amount),
    type: tx.type,
    category: tx.category,
    date: tx.date.toISOString().slice(0, 10),
    note: tx.note,
  };
}

export async function getTransactions(
  userId: string,
  from: Date,
  to: Date
): Promise<TransactionItem[]> {
  const transactions = await db.financeTransaction.findMany({
    where: { userId, date: { gte: from, lt: to } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return transactions.map(serializeTransaction);
}

export async function getTransaction(userId: string, id: string): Promise<TransactionItem | null> {
  const tx = await db.financeTransaction.findFirst({ where: { id, userId } });
  return tx ? serializeTransaction(tx) : null;
}

export function summarize(transactions: TransactionItem[]): MonthlySummary {
  let income = 0;
  let expense = 0;
  const categoryTotals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === 'income') {
      income += tx.amount;
    } else {
      expense += tx.amount;
      categoryTotals.set(tx.category, (categoryTotals.get(tx.category) ?? 0) + tx.amount);
    }
  }
  const byCategory = [...categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  return { income, expense, balance: income - expense, byCategory };
}

export async function getBudgets(
  userId: string,
  month: string,
  byCategory: Map<string, number>
): Promise<BudgetItem[]> {
  const budgets = await db.budget.findMany({
    where: { userId, month },
    orderBy: { category: 'asc' },
  });
  return budgets.map((budget) => ({
    id: budget.id,
    category: budget.category,
    amount: Number(budget.amount),
    month: budget.month,
    spent: byCategory.get(budget.category) ?? 0,
  }));
}

export type FinanceOverview = {
  transactions: TransactionItem[];
  summary: MonthlySummary;
  budgets: BudgetItem[];
  month: string;
};

export async function getFinanceOverview(
  userId: string,
  year: number,
  month: number
): Promise<FinanceOverview> {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const transactions = await getTransactions(userId, from, to);
  const summary = summarize(transactions);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const byCategory = new Map(summary.byCategory.map((item) => [item.category, item.amount]));
  const budgets = await getBudgets(userId, monthKey, byCategory);
  return { transactions, summary, budgets, month: monthKey };
}

export type TransactionInput = {
  amount: number;
  type?: TransactionTypeLiteral | undefined;
  category: string;
  date: string;
  note?: string | null | undefined;
};

export type TransactionUpdateInput = {
  amount?: number | undefined;
  type?: TransactionTypeLiteral | undefined;
  category?: string | undefined;
  date?: string | undefined;
  note?: string | null | undefined;
};

export async function createTransaction(userId: string, input: TransactionInput) {
  const tx = await db.financeTransaction.create({
    data: {
      userId,
      amount: input.amount,
      type: input.type ?? 'expense',
      category: input.category,
      date: new Date(`${input.date}T00:00:00Z`),
      note: input.note ?? null,
    },
  });
  return serializeTransaction(tx);
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: TransactionUpdateInput
): Promise<TransactionItem | null> {
  const existing = await db.financeTransaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.FinanceTransactionUncheckedUpdateInput = {};
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.type !== undefined) data.type = input.type;
  if (input.category !== undefined) data.category = input.category;
  if (input.date !== undefined) data.date = new Date(`${input.date}T00:00:00Z`);
  if (input.note !== undefined) data.note = input.note;

  if (Object.keys(data).length > 0) {
    await db.financeTransaction.update({ where: { id }, data });
  }

  return getTransaction(userId, id);
}

export async function deleteTransaction(userId: string, id: string) {
  return db.financeTransaction.delete({ where: { id, userId } });
}

export type BudgetInput = {
  category: string;
  amount: number;
  month: string;
};

export type BudgetUpdateInput = {
  category?: string | undefined;
  amount?: number | undefined;
  month?: string | undefined;
};

async function spentForCategory(userId: string, category: string, month: string): Promise<number> {
  const [year, m] = month.split('-').map(Number) as [number, number];
  const from = new Date(year, m - 1, 1);
  const to = new Date(year, m, 1);
  const rows = await db.financeTransaction.findMany({
    where: { userId, category, type: 'expense', date: { gte: from, lt: to } },
    select: { amount: true },
  });
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function createBudget(userId: string, input: BudgetInput): Promise<BudgetItem> {
  const budget = await db.budget.create({
    data: {
      userId,
      category: input.category,
      amount: input.amount,
      month: input.month,
    },
  });
  return {
    id: budget.id,
    category: budget.category,
    amount: Number(budget.amount),
    month: budget.month,
    spent: await spentForCategory(userId, budget.category, budget.month),
  };
}

export async function updateBudget(
  userId: string,
  id: string,
  input: BudgetUpdateInput
): Promise<BudgetItem | null> {
  const existing = await db.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const data: Prisma.BudgetUncheckedUpdateInput = {};
  if (input.category !== undefined) data.category = input.category;
  if (input.amount !== undefined) data.amount = input.amount;
  if (input.month !== undefined) data.month = input.month;

  if (Object.keys(data).length > 0) {
    await db.budget.update({ where: { id }, data });
  }

  const updated = await db.budget.findFirst({ where: { id, userId } });
  if (!updated) return null;
  return {
    id: updated.id,
    category: updated.category,
    amount: Number(updated.amount),
    month: updated.month,
    spent: await spentForCategory(userId, updated.category, updated.month),
  };
}

export async function deleteBudget(userId: string, id: string) {
  return db.budget.delete({ where: { id, userId } });
}
