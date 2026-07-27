'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const cardVariants = cva(
  'rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] text-[rgb(var(--card-foreground))] shadow-[var(--shadow-sm)] transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'hover:shadow-[var(--shadow-md)]',
        elevated: 'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
        outlined: 'border-2 shadow-none',
        filled: 'bg-[rgb(var(--panel-2))] border-transparent',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export type CardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[rgb(var(--muted))]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-4', className)} {...props} />;
}
