'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (input: { title: string; description?: string; variant?: ToastVariant }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: 'border-[rgb(var(--border-color))] bg-[rgb(var(--card))]',
  success: 'border-[rgb(var(--success))] bg-[rgb(var(--card))]',
  error: 'border-[rgb(var(--danger))] bg-[rgb(var(--card))]',
  warning: 'border-[rgb(var(--warning))] bg-[rgb(var(--card))]',
};

const VARIANT_DOT: Record<ToastVariant, string> = {
  default: 'bg-[rgb(var(--primary))]',
  success: 'bg-[rgb(var(--success))]',
  error: 'bg-[rgb(var(--danger))]',
  warning: 'bg-[rgb(var(--warning))]',
};

/**
 * Lightweight toast system used across Sprint 3C modules.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    ({ title, description, variant = 'default' }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-[var(--shadow-md)] ${VARIANT_CLASS[t.variant]}`}
          >
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${VARIANT_DOT[t.variant]}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-[rgb(var(--text))]">{t.title}</p>
              {t.description && <p className="text-xs text-[rgb(var(--muted))]">{t.description}</p>}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
