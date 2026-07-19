'use client';

import * as React from 'react';

import { cn } from '@/lib/cn';

/**
 * Text Input.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Reusable Input component.
 */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

