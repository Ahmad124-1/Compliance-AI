'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Users, Building2, ShieldCheck, Factory, Network } from 'lucide-react';

import { cn } from '@/lib/cn.js';
import { Button } from '@/components/ui/button.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { FileText, Briefcase, QrCode, BarChart3, MessageSquare, Settings2, ListChecks, Search, ShieldAlert, Cpu } from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: Network },
  { href: '/executive', label: 'Executive Dashboard', icon: BarChart3, perm: 'analytics:read' },
  { href: '/search', label: 'Global Search', icon: Search, perm: 'search:read' },
  { href: '/admin/users', label: 'Users', icon: Users, perm: 'user:read' },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2, perm: 'org:read' },
  { href: '/admin/sites', label: 'Sites', icon: Factory, perm: 'site:read' },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'role:read' },
  { href: '/standards', label: 'Standards', icon: ShieldCheck, perm: 'standard:read' },
  { href: '/admin/grievances', label: 'Grievances', icon: FileText, perm: 'grievance:read' },
  { href: '/admin/cases', label: 'Cases', icon: Briefcase, perm: 'case:read' },
  { href: '/qr-codes', label: 'QR Codes', icon: QrCode, perm: 'qr:read' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:read' },
  { href: '/reports', label: 'Reports & Exports', icon: FileText, perm: 'analytics:read' },
  { href: '/worker-communication', label: 'Worker Comms', icon: MessageSquare, perm: 'case:read' },
  { href: '/communication-settings', label: 'Comm Settings', icon: Settings2, perm: 'organization:read' },
  { href: '/queue', label: 'Queue', icon: ListChecks, perm: 'queue:read' },
  { href: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert, perm: 'audit:read' },
  { href: '/admin/security', label: 'Security Review', icon: ShieldCheck, perm: 'organization:read' },
  { href: '/admin/ai', label: 'AI Foundation', icon: Cpu, perm: 'ai:read' },
  { href: '/assessments', label: 'Assessments', icon: ListChecks, perm: 'assessment:read' },
  { href: '/audits', label: 'Audits', icon: FileText, perm: 'audit:read' },
  { href: '/capa', label: 'Findings & CAPA', icon: ShieldAlert, perm: 'capa:read' },
];

/**
 * Dashboard shell with sidebar navigation and tenant/role-aware links.
 */
export function DashboardNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, hasPermission, logout } = useAuth();

  return (
    <div className="flex min-h-dvh">
      <aside className="w-60 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold">ComplianceOS</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">{session?.organization.name}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.filter((n) => !n.perm || hasPermission(n.perm)).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                  active ? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))]',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
