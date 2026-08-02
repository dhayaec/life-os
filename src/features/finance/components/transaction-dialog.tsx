'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from '@/features/finance/actions';
import type { TransactionTypeLiteral } from '@/features/finance/services/finance-service';

export type TransactionInitial = {
  id: string | null;
  amount: number | null;
  type: TransactionTypeLiteral;
  category: string;
  date: string;
  note: string;
};

export function TransactionDialog({
  initial,
  open,
  onClose,
}: {
  initial: TransactionInitial | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [type, setType] = useState<TransactionTypeLiteral>(initial?.type ?? 'expense');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

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
    if (!category.trim() || !date) {
      toast.error('Category and date are required');
      return;
    }
    const payload = {
      amount: parsed,
      type,
      category: category.trim(),
      date,
      note: note.trim() || null,
    };
    const result = isEdit
      ? await updateTransactionAction({ id: current.id, ...payload })
      : await createTransactionAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!current.id) return;
    const result = await deleteTransactionAction({ id: current.id });
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
            <DialogTitle>{isEdit ? 'Edit transaction' : 'New transaction'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-amount">Amount</Label>
              <Input
                id="tx-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="25.00"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as TransactionTypeLiteral)}
              >
                <SelectTrigger id="tx-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-category">Category</Label>
              <Input
                id="tx-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Groceries"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tx-note">Note</Label>
            <Input
              id="tx-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Weekly shop"
            />
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
