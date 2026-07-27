import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn.js';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 rounded px-1 py-0.5',
                    'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                  )}
                >
                  {isFirst ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1 px-1 py-0.5',
                    isLast ? 'font-medium text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))]',
                  )}
                >
                  {isFirst ? <Home className="h-3.5 w-3.5" /> : null}
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="h-3.5 w-3.5 text-[rgb(var(--border-color))]" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
