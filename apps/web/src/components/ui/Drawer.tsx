'use client';

import { useEffect, type ReactNode } from 'react';

import { cn } from '@/lib/cn';
import { Button } from './button.js';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: string;
}

export function Drawer({ open, onClose, title, children, width = 'max-w-md' }: DrawerProps) {
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-[rgb(var(--border-color))] bg-[rgb(var(--card))] shadow-[var(--shadow-lg)]',
          width,
        )}
      >
        <div className="mb-4 flex items-center justify-between px-5 pt-5">
          {title && <h2 className="text-lg font-semibold text-[rgb(var(--text))]">{title}</h2>}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}
