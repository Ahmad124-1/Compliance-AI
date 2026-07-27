'use client';

import * as React from 'react';

import { cn } from '@/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          'flex h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none transition-all duration-200',
          'ring-offset-background',
          'placeholder:text-[rgb(var(--muted-2))]',
          'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-[rgb(var(--danger))] focus-visible:ring-[rgb(var(--danger))]',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[rgb(var(--danger))]">{error}</p>}
    </div>
  );
}
