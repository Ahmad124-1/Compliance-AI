'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  Cpu,
  MessageSquare,
  BookOpen,
  FileText,
  Search,
  PenLine,
  History,
  BarChart3,
  Settings2,
  ClipboardCheck,
  TrendingUp,
  Bot,
} from 'lucide-react';

import { cn } from '@/lib/cn.js';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const SIDEBAR_NAV: NavItem[] = [
  { href: '/ai', label: 'Overview', icon: Cpu, exact: true },
  { href: '/ai/audit-assistant', label: 'Audit Assistant', icon: ClipboardCheck },
  { href: '/ai/chat', label: 'Chat', icon: MessageSquare },
  { href: '/ai/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { href: '/ai/document-ai', label: 'Document AI', icon: FileText },
  { href: '/ai/clause-explorer', label: 'Clause Explorer', icon: Search },
  { href: '/ai/policy-generator', label: 'Policy Generator', icon: PenLine },
  { href: '/ai/conversations', label: 'Conversation History', icon: History },
  { href: '/ai/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/ai/predictive', label: 'Predictive Intelligence', icon: TrendingUp },
  { href: '/ai/autonomous', label: 'Autonomous Compliance', icon: Bot },
  { href: '/ai/settings', label: 'Settings', icon: Settings2 },
];

export default function AiLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const visibleNav = useMemo(
    () => SIDEBAR_NAV.filter((n) => !n.exact || pathname === n.href || pathname.startsWith(n.href)),
    [pathname],
  );

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-60 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3 lg:block">
        <div className="mb-4 px-2">
          <h2 className="text-sm font-semibold">AI Compliance Copilot</h2>
          <p className="text-xs text-[rgb(var(--muted))]">Enterprise AI workspace</p>
        </div>
        <nav className="flex flex-col gap-0.5">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                  active
                    ? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'
                    : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))] hover:text-[rgb(var(--text))]',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
