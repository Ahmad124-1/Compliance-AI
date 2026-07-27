'use client';

import { useEffect, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] p-6 shadow-[var(--shadow-lg)]',
          SIZE[size],
        )}
      >
        {title && <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h2>}
        {description && <p className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</p>}
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
