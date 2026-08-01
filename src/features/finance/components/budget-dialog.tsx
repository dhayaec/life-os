'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createBudgetAction,
  deleteBudgetAction,
  updateBudgetAction,
} from '@/features/finance/actions';

export type BudgetInitial = {
  id: string | null;
  category: string;
  amount: number | null;
  month: string;
};

export function BudgetDialog({
  initial,
  open,
  onClose,
}: {
  initial: BudgetInitial | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? '');
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [month, setMonth] = useState(initial?.month ?? '');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = Number(amount);
    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!category.trim() || !month) {
      toast.error('Category and month are required');
      return;
    }
    const payload = { category: category.trim(), amount: parsed, month };
    const result = isEdit
      ? await updateBudgetAction({ id: current.id, ...payload })
      : await createBudgetAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!current.id) return;
    const result = await deleteBudgetAction({ id: current.id });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit budget' : 'New budget'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-category">Category</Label>
            <Input
              id="budget-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Groceries"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-amount">Monthly limit</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="300.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-month">Month</Label>
              <Input
                id="budget-month"
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            {isEdit ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
