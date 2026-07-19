'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input.js';
import { cn } from '@/lib/cn.js';

/**
 * Labeled field wrapper with error + hint support.
 */
export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-[rgb(var(--text))]">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-[rgb(var(--muted))]">{hint}</p>}
      {error && <p className="text-xs text-[rgb(var(--danger))]">{error}</p>}
    </div>
  );
}

export { Input };
