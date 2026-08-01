'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { useLocale } from '@/providers/locale-provider';
import { BudgetDialog, type BudgetInitial } from '@/features/finance/components/budget-dialog';
import {
  TransactionDialog,
  type TransactionInitial,
} from '@/features/finance/components/transaction-dialog';
import type {
  BudgetItem,
  MonthlySummary,
  TransactionItem,
} from '@/features/finance/services/finance-service';

const CATEGORY_COLORS = [
  '#6366f1',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

export function FinanceView({
  transactions,
  summary,
  budgets,
  month,
}: {
  transactions: TransactionItem[];
  summary: MonthlySummary;
  budgets: BudgetItem[];
  month: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const [txDialog, setTxDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; tx: TransactionItem } | null
  >(null);
  const [budgetDialog, setBudgetDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; budget: BudgetItem } | null
  >(null);

  function goToMonth(offset: number) {
    const parts = month.split('-').map(Number);
    const year = parts[0] ?? new Date().getFullYear();
    const monthIndex = parts[1] ?? new Date().getMonth() + 1;
    const target = new Date(year, monthIndex - 1 + offset, 1);
    const params = new URLSearchParams(searchParams);
    params.set(
      'month',
      `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}`
    );
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToToday() {
    const now = new Date();
    const params = new URLSearchParams(searchParams);
    params.set('month', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  const categoryColors = new Map<string, string>();
  for (const item of summary.byCategory) {
    if (!categoryColors.has(item.category)) {
      categoryColors.set(
        item.category,
        CATEGORY_COLORS[categoryColors.size % CATEGORY_COLORS.length] ?? '#64748b'
      );
    }
  }
  const colorFor = (category: string) => categoryColors.get(category) ?? '#64748b';

  const pieData = summary.byCategory.map((item) => ({
    name: item.category,
    value: item.amount,
    fill: colorFor(item.category),
  }));

  const txDialogInitial: TransactionInitial | null = txDialog
    ? txDialog.mode === 'edit'
      ? {
          id: txDialog.tx.id,
          amount: txDialog.tx.amount,
          type: txDialog.tx.type,
          category: txDialog.tx.category,
          date: txDialog.tx.date,
          note: txDialog.tx.note ?? '',
        }
      : {
          id: null,
          amount: null,
          type: 'expense',
          category: '',
          date: todayKey(),
          note: '',
        }
    : null;

  const budgetDialogInitial: BudgetInitial | null = budgetDialog
    ? budgetDialog.mode === 'edit'
      ? {
          id: budgetDialog.budget.id,
          category: budgetDialog.budget.category,
          amount: budgetDialog.budget.amount,
          month: budgetDialog.budget.month,
        }
      : { id: null, category: '', amount: null, month }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => goToMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold">{monthLabel(month)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setBudgetDialog({ mode: 'create' })}>
            <Plus className="size-4" />
            Budget
          </Button>
          <Button size="sm" onClick={() => setTxDialog({ mode: 'create' })}>
            <Plus className="size-4" />
            Transaction
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Income" value={summary.income} className="text-emerald-600" />
        <SummaryCard label="Expenses" value={summary.expense} className="text-red-600" />
        <SummaryCard
          label="Balance"
          value={summary.balance}
          className={summary.balance >= 0 ? '' : 'text-red-600'}
        />
      </div>

      {summary.byCategory.length > 0 || budgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {summary.byCategory.length > 0 ? (
            <div className="rounded-md border p-4">
              <h2 className="text-sm font-semibold">Spending by category</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {summary.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: colorFor(item.category) }}
                      />
                      {item.category}
                    </span>
                    <span>{formatCurrency(item.amount, locale)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <BudgetSection
            budgets={budgets}
            onEdit={(budget) => setBudgetDialog({ mode: 'edit', budget })}
            onCreate={() => setBudgetDialog({ mode: 'create' })}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Transactions</h2>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No transactions this month.</p>
        ) : (
          <div className="flex flex-col">
            {transactions.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => setTxDialog({ mode: 'edit', tx })}
                className="flex items-center justify-between gap-2 rounded-md border-b px-2 py-2 text-left last:border-b-0 hover:bg-accent/50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">{tx.category}</span>
                  {tx.note ? (
                    <span className="text-muted-foreground truncate text-xs">{tx.note}</span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-muted-foreground text-xs">{tx.date}</span>
                  <span
                    className={`text-sm font-medium ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, locale)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TransactionDialog
        key={txDialog?.mode === 'edit' ? txDialog.tx.id : txDialog ? 'new' : 'none'}
        initial={txDialogInitial}
        open={txDialog !== null}
        onClose={() => setTxDialog(null)}
      />
      <BudgetDialog
        key={budgetDialog?.mode === 'edit' ? budgetDialog.budget.id : budgetDialog ? 'new' : 'none'}
        initial={budgetDialogInitial}
        open={budgetDialog !== null}
        onClose={() => setBudgetDialog(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="rounded-md border p-4">
      <div className="text-muted-foreground text-xs font-medium uppercase">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${className ?? ''}`}>
        {formatCurrency(value, locale)}
      </div>
    </div>
  );
}

function BudgetSection({
  budgets,
  onEdit,
  onCreate,
}: {
  budgets: BudgetItem[];
  onEdit: (budget: BudgetItem) => void;
  onCreate: () => void;
}) {
  const { locale } = useLocale();
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Budgets</h2>
        <Button variant="outline" size="sm" onClick={onCreate}>
          <Plus className="size-3.5" />
          Budget
        </Button>
      </div>
      {budgets.length === 0 ? (
        <p className="text-muted-foreground mt-2 text-sm">No budgets set for this month.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const over = budget.spent > budget.amount;
            return (
              <button
                key={budget.id}
                type="button"
                onClick={() => onEdit(budget)}
                className="text-left"
              >
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(budget.spent, locale)} / {formatCurrency(budget.amount, locale)}
                  </span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: over ? '#ef4444' : '#6366f1',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function monthLabel(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year ?? new Date().getFullYear(), (monthIndex ?? 1) - 1, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' }
  );
}

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}
