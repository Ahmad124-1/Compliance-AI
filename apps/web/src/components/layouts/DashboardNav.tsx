'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  Users,
  Building2,
  ShieldCheck,
  Factory,
  Network,
  Menu,
  X,
  Leaf,
  Recycle,
  Target,
  TrendingUp,
  Rocket,
  Briefcase,
  QrCode,
  BarChart3,
  MessageSquare,
  Settings2,
  ListChecks,
  Search,
  ShieldAlert,
  Cpu,
  Building,
  Gauge,
  AlertTriangle,
  Truck,
  Layers,
  Siren,
  Bell,
  Timer,
  LayoutTemplate,
  Scale,
  Headphones,
  BookOpen,
  Phone,
  Mail,
  MailOpen,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Inbox,
  FileText,
  Droplets,
  Trash2,
  Wind,
  FlaskConical,
  Shield,
  FileCheck,
  Zap,
  TreePine,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/cn.js';
import { Button } from '@/components/ui/button.js';
import { ThemeToggle } from './ThemeToggle.js';
import { useAuth } from '@/providers/AuthProvider.js';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: Network },
  { href: '/worker-voice', label: 'Worker Voice', icon: Scale, perm: 'grievance:read' },
  { href: '/worker-voice/my-cases', label: 'My Cases', icon: Briefcase, perm: 'case:read' },
  { href: '/worker-voice/hotline', label: 'Ethics Hotline', icon: Phone, perm: 'organization:read' },
  { href: '/worker-voice/report', label: 'Report Concern', icon: FileText, perm: 'grievance:create' },
  { href: '/worker-voice/ai-assistant', label: 'AI Worker Assistant', icon: Headphones, perm: 'ai:read' },
  { href: '/worker-voice/knowledge-center', label: 'Knowledge Center', icon: BookOpen, perm: 'organization:read' },
  { href: '/executive', label: 'Executive Dashboard', icon: BarChart3, perm: 'analytics:read' },
  { href: '/search', label: 'Global Search', icon: Search, perm: 'search:read' },
  { href: '/organization', label: 'Organization', icon: Building, perm: 'organization:read' },
  { href: '/compliance-score', label: 'Compliance Score', icon: Gauge, perm: 'analytics:read' },
  { href: '/risk', label: 'Risk', icon: AlertTriangle, perm: 'risk:read' },
  { href: '/supplier', label: 'Supplier', icon: Truck, perm: 'supplier:read' },
  { href: '/factory', label: 'Factory', icon: Factory, perm: 'site:read' },
  { href: '/department', label: 'Department', icon: Layers, perm: 'organization:read' },
  { href: '/admin/users', label: 'Users', icon: Users, perm: 'user:read' },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2, perm: 'org:read' },
  { href: '/admin/sites', label: 'Sites', icon: Factory, perm: 'site:read' },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'role:read' },
  { href: '/standards', label: 'Standards', icon: ShieldCheck, perm: 'standard:read' },
  { href: '/dashboard/sustainability', label: 'Sustainability', icon: Leaf, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/programs', label: 'Programs', icon: Recycle, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/goals', label: ' ESG Goals', icon: Target, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/kpis', label: 'KPIs', icon: TrendingUp, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/initiatives', label: 'Initiatives', icon: Rocket, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/reports', label: 'Reports', icon: FileText, perm: 'sustainability:read' },
  { href: '/dashboard/sustainability/settings', label: 'Settings', icon: Settings2, perm: 'sustainability:read' },
  { href: '/dashboard/environment', label: 'Environmental Management', icon: Leaf, perm: 'environment:read' },
  { href: '/dashboard/environment/water', label: 'Water', icon: Droplets, perm: 'environment:read' },
  { href: '/dashboard/environment/waste', label: 'Waste', icon: Trash2, perm: 'environment:read' },
  { href: '/dashboard/environment/air', label: 'Air', icon: Wind, perm: 'environment:read' },
  { href: '/dashboard/environment/chemicals', label: 'Chemicals', icon: FlaskConical, perm: 'environment:read' },
  { href: '/dashboard/environment/incidents', label: 'Incidents', icon: AlertTriangle, perm: 'environment:read' },
  { href: '/dashboard/environment/risks', label: 'Risk Register', icon: Shield, perm: 'environment:read' },
  { href: '/dashboard/environment/permits', label: 'Permits', icon: FileCheck, perm: 'environment:read' },
  { href: '/dashboard/environment/resources', label: 'Resources', icon: Zap, perm: 'environment:read' },
  { href: '/dashboard/environment/projects', label: 'Biodiversity', icon: TreePine, perm: 'environment:read' },
  { href: '/dashboard/environment/settings', label: 'EMS Settings', icon: Settings2, perm: 'environment:read' },
  { href: '/dashboard/esg', label: 'ESG Reporting', icon: BookOpen, perm: 'esg:read' },
  { href: '/dashboard/esg/frameworks', label: 'Frameworks', icon: BookOpen, perm: 'esg:read' },
  { href: '/dashboard/esg/metrics', label: 'Metrics', icon: TrendingUp, perm: 'esg:read' },
  { href: '/dashboard/esg/periods', label: 'Periods', icon: ClipboardList, perm: 'esg:read' },
  { href: '/dashboard/esg/disclosures', label: 'Disclosures', icon: FileText, perm: 'esg:read' },
  { href: '/dashboard/esg/reports', label: 'ESG Reports', icon: BarChart3, perm: 'esg:read' },
  { href: '/dashboard/esg/materiality', label: 'Materiality', icon: Target, perm: 'esg:read' },
  { href: '/dashboard/esg/assurance', label: 'Assurance', icon: ShieldCheck, perm: 'esg:read' },
  { href: '/admin/grievances', label: 'Grievances', icon: FileText, perm: 'grievance:read' },
  { href: '/admin/cases', label: 'Cases', icon: Briefcase, perm: 'case:read' },
  { href: '/escalation', label: 'Escalation', icon: Siren, perm: 'case:read' },
  { href: '/notifications', label: 'Notifications', icon: Bell, perm: 'organization:read' },
  { href: '/sla', label: 'SLA', icon: Timer, perm: 'organization:read' },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate, perm: 'organization:read' },
  { href: '/qr-codes', label: 'QR Codes', icon: QrCode, perm: 'qr:read' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:read' },
  { href: '/reports', label: 'Reports & Exports', icon: FileText, perm: 'analytics:read' },
  { href: '/worker-communication', label: 'Worker Comms', icon: MessageSquare, perm: 'case:read' },
  { href: '/communication-settings', label: 'Comm Settings', icon: Settings2, perm: 'organization:read' },
  { href: '/communication-hub', label: 'Communication Hub', icon: Mail, perm: 'organization:read' },
  { href: '/communication-hub/inbox', label: 'Inbox', icon: Inbox, perm: 'organization:read' },
  { href: '/communication-hub/chat', label: 'Chat', icon: MessageSquare, perm: 'organization:read' },
  { href: '/communication-hub/broadcasts', label: 'Broadcasts', icon: Bell, perm: 'organization:read' },
  { href: '/communication-hub/emergency', label: 'Emergency Center', icon: Siren, perm: 'organization:read' },
  { href: '/communication-hub/calendar', label: 'Calendar', icon: CalendarIcon, perm: 'organization:read' },
  { href: '/communication-hub/analytics', label: 'Comm Analytics', icon: BarChart3, perm: 'analytics:read' },
  { href: '/communication-hub/manager', label: 'Comm Manager', icon: UsersIcon, perm: 'organization:read' },
  { href: '/queue', label: 'Queue', icon: ListChecks, perm: 'queue:read' },
  { href: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert, perm: 'audit:read' },
  { href: '/admin/security', label: 'Security Review', icon: ShieldCheck, perm: 'organization:read' },
  { href: '/admin/ai', label: 'AI Foundation (Legacy)', icon: Cpu, perm: 'ai:read' },
  { href: '/ai', label: 'AI Compliance Copilot', icon: Cpu, perm: 'ai:read' },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    if (mobileOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [mobileOpen]);

  const visibleNav = NAV.filter((n) => !n.perm || hasPermission(n.perm));

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <p className="text-sm font-semibold">ComplianceOS</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">{session?.organization.name}</p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
                active
                  ? 'bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]'
                  : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--panel-2))]',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="pt-6">
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
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <button
        type="button"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] text-[rgb(var(--text))] md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4 md:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-60 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-4">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto p-6 md:ml-60">{children}</main>
    </div>
  );
}
