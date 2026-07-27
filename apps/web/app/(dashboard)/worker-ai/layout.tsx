'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn.js';
import { WORKER_AI_ROUTES } from '@/modules/worker-ai/constants.js';

const SIDEBAR_NAV = [
  { href: WORKER_AI_ROUTES.home, label: 'AI Chat', icon: 'MessageSquare' },
  { href: WORKER_AI_ROUTES.documents, label: 'Documents', icon: 'FileText' },
  { href: WORKER_AI_ROUTES.training, label: 'Training', icon: 'GraduationCap' },
  { href: WORKER_AI_ROUTES.rights, label: 'Rights', icon: 'Shield' },
  { href: WORKER_AI_ROUTES.emergency, label: 'Emergency', icon: 'AlertTriangle' },
];

export default function WorkerAiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4 md:block">
        <div className="mb-4">
          <p className="text-sm font-semibold">AI Worker Assistant</p>
          <p className="text-xs text-[rgb(var(--muted))]">Multilingual digital companion</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {SIDEBAR_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== WORKER_AI_ROUTES.home && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'
                    : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))]',
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon === 'MessageSquare' && <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}
                  {item.icon === 'FileText' && <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>}
                  {item.icon === 'GraduationCap' && <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>}
                  {item.icon === 'Shield' && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}
                  {item.icon === 'AlertTriangle' && <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:ml-56">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
