'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm hover:shadow-md hover:opacity-90',
        subtle: 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border-color))]',
        outline: 'border border-[rgb(var(--border-color))] bg-transparent hover:bg-[rgb(var(--panel-2))] shadow-sm',
        ghost: 'bg-transparent hover:bg-[rgb(var(--panel-2))]',
        destructive: 'bg-[rgb(var(--danger))] text-[rgb(var(--danger-foreground))] shadow-sm hover:shadow-md',
        success: 'bg-[rgb(var(--success))] text-[rgb(var(--success-foreground))] shadow-sm hover:shadow-md',
        warning: 'bg-[rgb(var(--warning))] text-[rgb(var(--warning-foreground))] shadow-sm hover:shadow-md',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
