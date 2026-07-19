'use client';

import * as React from 'react';

import { cn } from '@/lib/cn';

/**
 * Textarea props.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Reusable Textarea.
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-[96px] w-full resize-none rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

