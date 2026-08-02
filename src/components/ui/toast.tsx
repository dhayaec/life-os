'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration: number;
};

type ToastStore = {
  toasts: ToastItem[];
  add: (toast: ToastItem) => void;
  remove: (id: string) => void;
};

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => set((state) => ({ toasts: [...state.toasts, toast] })),
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

function push(
  type: ToastType,
  message: string,
  options?: { description?: string; duration?: number }
) {
  const toast: ToastItem = {
    id: crypto.randomUUID(),
    type,
    message,
    ...(options?.description !== undefined ? { description: options.description } : {}),
    duration: options?.duration ?? 4000,
  };
  useToastStore.getState().add(toast);
  setTimeout(() => useToastStore.getState().remove(toast.id), toast.duration);
}

export const toast = {
  success: (message: string, options?: { description?: string; duration?: number }) =>
    push('success', message, options),
  error: (message: string, options?: { description?: string; duration?: number }) =>
    push('error', message, options),
  info: (message: string, options?: { description?: string; duration?: number }) =>
    push('info', message, options),
  message: (message: string, options?: { description?: string; duration?: number }) =>
    push('info', message, options),
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex flex-col gap-2">
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => remove(item.id)} />
      ))}
    </div>
  );
}

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ICON_COLORS: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-blue-500',
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = ICONS[item.type];
  return (
    <div
      role="status"
      className="pointer-events-auto flex w-80 items-start gap-2 rounded-md border bg-popover p-3 text-popover-foreground shadow-lg"
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${ICON_COLORS[item.type]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.message}</p>
        {item.description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-muted-foreground hover:text-foreground rounded p-0.5"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
