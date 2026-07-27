'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn.js';

import { WORKER_ROUTES } from '@/modules/worker-platform/constants.js';
import { workerRoutesMap } from '@/modules/worker-platform/routes.js';

const SIDEBAR_NAV = [
  { href: WORKER_ROUTES.overview, label: 'Overview', icon: 'LayoutDashboard' },
  { href: WORKER_ROUTES.profile, label: 'My Profile', icon: 'User' },
  { href: WORKER_ROUTES.directory, label: 'Worker Directory', icon: 'Users' },
  { href: WORKER_ROUTES.announcements, label: 'Announcements', icon: 'Megaphone' },
  { href: WORKER_ROUTES.tasks, label: 'My Tasks', icon: 'CheckSquare' },
  { href: WORKER_ROUTES.documents, label: 'Documents', icon: 'FileText' },
  { href: WORKER_ROUTES.forms, label: 'Forms', icon: 'FileCheck' },
  { href: WORKER_ROUTES.learning, label: 'Learning Center', icon: 'GraduationCap' },
  { href: '/worker-ai', label: 'AI Assistant', icon: 'Bot' },
  { href: WORKER_ROUTES.support, label: 'Support Center', icon: 'HelpCircle' },
  { href: WORKER_ROUTES.settings, label: 'Settings', icon: 'Settings' },
];

export default function WorkersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4 md:block">
        <div className="mb-4">
          <p className="text-sm font-semibold">Worker Experience</p>
          <p className="text-xs text-[rgb(var(--muted))]">My Workplace</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {SIDEBAR_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== '/workers' && pathname.startsWith(item.href));
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
                  {item.icon === 'LayoutDashboard' && <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}
                  {item.icon === 'User' && <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                  {item.icon === 'Users' && <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}
                  {item.icon === 'Megaphone' && <><path d="m3 11 18-8v16L3 13z"/><path d="M11 6v14"/></>}
                  {item.icon === 'CheckSquare' && <><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></>}
                  {item.icon === 'FileText' && <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></>}
                  {item.icon === 'FileCheck' && <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></>}
                  {item.icon === 'GraduationCap' && <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>}
                  {item.icon === 'HelpCircle' && <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></>}
                  {item.icon === 'Bot' && <><rect x='3' y='11' width='18' height='10' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></>}
                  {item.icon === 'Settings' && <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}
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
