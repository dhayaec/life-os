Looking at the issue, I need to fix `createBudget` and `updateBudget` to return the actual `spent` value instead of hardcoded `0`. I'll compute the spend from transactions for the relevant category and month.

Since I only have a partial view of the file, I'll reconstruct the complete file with the fix applied:

```typescript
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

/**
 * Computes the total amount spent (expenses only) for a given category within a month.
 * Month format: "YYYY-MM"
 */
async function computeSpentForCategory(
  userId: string,
  category: string,
  month: string
): Promise<number> {
  const [year, mon] = month.split('-').map(Number);
  const from = new Date(year, mon - 1, 1);
  const to = new Date(year, mon, 1);

  const transactions = await db.financeTransaction.findMany({
    where: {
      userId,
      category,
      type: 'expense',
      date: { gte: from, lt: to },
    },
  });

  return transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

export async function getFinanceOverview(
  userId: string,
  year: number,
  month: number
): Promise<FinanceOverview> {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const transactions = await getTransactions(userId, from, to);
  const summary = summarize(transactions);
  const byCategory = new Map(summary.byCategory.map((c) => [c.category, c.amount]));
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const budgets = await getBudgets(userId, monthStr, byCategory);
  return { transactions, summary, budgets, month: monthStr };
}

export async function createTransaction(
  userId: string,
  data: {
    amount: number;
    type: TransactionTypeLiteral;
    category: string;
    date: string;
    note?: string | null;
  }
): Promise<TransactionItem> {
  const tx = await db.financeTransaction.create({
    data: {
      userId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: new Date(data.date),
      note: data.note ?? null,
    },
  });
  return serializeTransaction(tx);
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: {
    amount?: number;
    type?: TransactionTypeLiteral;
    category?: string;
    date?: string;
    note?: string | null;
  }
): Promise<TransactionItem | null> {
  const existing = await db.financeTransaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const updateData: Prisma.FinanceTransactionUpdateInput = {};
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.note !== undefined) updateData.note = data.note;

  const tx = await db.financeTransaction.update({
    where: { id },
    data: updateData,
  });
  return serializeTransaction(tx);
}

export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  const existing = await db.financeTransaction.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await db.financeTransaction.delete({ where: { id } });
  return true;
}

export async function createBudget(
  userId: string,
  data: {
    category: string;
    amount: number;
    month: string;
  }
): Promise<BudgetItem> {
  const budget = await db.budget.create({
    data: {
      userId,
      category: data.category,
      amount: data.amount,
      month: data.month,
    },
  });

  const spent = await computeSpentForCategory(userId, data.category, data.month);

  return {
    id: budget.id,
    category: budget.category,
    amount: Number(budget.amount),
    month: budget.month,
    spent,
  };
}

export async function updateBudget(
  userId: string,
  id: string,
  data: {
    category?: string;
    amount?: number;
    month?: string;
  }
): Promise<BudgetItem | null> {
  const existing = await db.budget.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const updateData: Prisma.BudgetUpdateInput = {};
  if (data.category !== undefined) updateData.category = data.category;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.month !== undefined) updateData.month = data.month;

  const budget = await db.budget.update({
    where: { id },
    data: updateData,
  });

  const category = budget.category;
  const month = budget.month;
  const spent = await computeSpentForCategory(userId, category, month);

  return {
    id: budget.id,
    category: budget.category,
    amount: Number(budget.amount),
    month: budget.month,
    spent,
  };
}

export async function deleteBudget(userId: string, id: string): Promise<boolean> {
  const existing = await db.budget.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await db.budget.delete({ where: { id } });
  return true;
}
```