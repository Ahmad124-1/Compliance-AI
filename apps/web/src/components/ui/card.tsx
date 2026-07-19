'use client';

import * as React from 'react';

import { cn } from '@/lib/cn';

/**
 * Card container.
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Card wrapper.
 */
export function Card({ className, ...props }: CardProps) {
  return <div className={cn('rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] shadow-[var(--shadow-sm))', className)} {...props} />;
}

