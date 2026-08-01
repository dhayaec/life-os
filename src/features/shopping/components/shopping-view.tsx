'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateShoppingItemAction } from '@/features/shopping/actions';
import { ItemDialog, type ItemInitial } from '@/features/shopping/components/item-dialog';
import type { ShoppingItem } from '@/features/shopping/services/shopping-service';

export function ShoppingView({
  items,
  categories,
  category,
}: {
  items: ShoppingItem[];
  categories: string[];
  category: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; item: ShoppingItem } | null
  >(null);

  const done = items.filter((item) => item.completed).length;

  function selectCategory(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') {
      params.delete('category');
    } else {
      params.set('category', next);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  async function toggle(item: ShoppingItem) {
    const result = await updateShoppingItemAction({
      id: item.id,
      completed: !item.completed,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  const groups = new Map<string, ShoppingItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  const orderedGroups = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const dialogInitial: ItemInitial | null = dialog
    ? dialog.mode === 'edit'
      ? {
          id: dialog.item.id,
          name: dialog.item.name,
          category: dialog.item.category,
          quantity: dialog.item.quantity,
          note: dialog.item.note ?? '',
        }
      : { id: null, name: '', category: category ?? '', quantity: 1, note: '' }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Shopping</h1>
          <Select value={category ?? 'all'} onValueChange={selectCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setDialog({ mode: 'create' })}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {category ? 'No items in this category.' : 'No items on your list yet.'}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {done} of {items.length} purchased
            {items.length - done > 0 ? ` · ${items.length - done} remaining` : ''}
          </p>
          <div className="flex flex-col gap-4">
            {orderedGroups.map(([groupName, groupItems]) => (
              <section key={groupName} className="flex flex-col gap-1">
                <h2 className="text-sm font-semibold text-muted-foreground">{groupName}</h2>
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md border-b px-2 py-2 last:border-b-0 hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggle(item)}
                      aria-label={`Mark ${item.name} as ${item.completed ? 'not purchased' : 'purchased'}`}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span
                        className={`truncate text-sm font-medium ${
                          item.completed ? 'text-muted-foreground line-through' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.quantity > 1 ? (
                        <Badge variant="secondary" className="shrink-0">
                          ×{item.quantity}
                        </Badge>
                      ) : null}
                      {item.note ? (
                        <span className="text-muted-foreground truncate text-xs">{item.note}</span>
                      ) : null}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${item.name}`}
                      onClick={() => setDialog({ mode: 'edit', item })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </>
      )}

      <ItemDialog
        key={dialog?.mode === 'edit' ? dialog.item.id : dialog ? 'new' : 'none'}
        initial={dialogInitial}
        categories={categories}
        open={dialog !== null}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
