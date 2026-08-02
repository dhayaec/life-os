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
  createShoppingItemAction,
  deleteShoppingItemAction,
  updateShoppingItemAction,
} from '@/features/shopping/actions';

export type ItemInitial = {
  id: string | null;
  name: string;
  category: string;
  quantity: number;
  note: string;
};

export function ItemDialog({
  initial,
  categories,
  open,
  onClose,
}: {
  initial: ItemInitial | null;
  categories: string[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '1');
  const [note, setNote] = useState(initial?.note ?? '');

  if (!initial) return null;
  const isEdit = initial.id !== null;
  const current = initial;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const parsed = Number(quantity);
    if (Number.isNaN(parsed) || parsed < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }
    const payload = {
      name: name.trim(),
      category: category.trim() || 'Other',
      quantity: parsed,
      note: note.trim() || null,
    };
    const result = isEdit
      ? await updateShoppingItemAction({ id: current.id, ...payload })
      : await createShoppingItemAction(payload);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  async function handleDelete() {
    if (!current.id) return;
    const result = await deleteShoppingItemAction({ id: current.id });
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
            <DialogTitle>{isEdit ? 'Edit item' : 'New item'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Milk"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-category">Category</Label>
              <Input
                id="item-category"
                list="item-category-list"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Groceries"
              />
              <datalist id="item-category-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-quantity">Quantity</Label>
              <Input
                id="item-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-note">Note</Label>
            <Input
              id="item-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="2%, large bottle"
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
