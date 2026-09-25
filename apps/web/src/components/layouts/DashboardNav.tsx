'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  Factory,
  Menu,
  X,
  Leaf,
  Recycle,
  Target,
  TrendingUp,
  Rocket,
  BarChart3,
  Settings2,
  Search,
  ShieldAlert,
  Gauge,
  AlertTriangle,
  Truck,
  Layers,
  FileText,
  Droplets,
  Trash2,
  Wind,
  FlaskConical,
  Shield as ShieldIcon,
  FileCheck,
  TreePine,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Globe,
  Cog as CalculatorIcon,
  BookOpen,
  FileBarChart,
  GitBranch,
  LayoutTemplate,
  Target as TargetIcon,
  FolderOpen,
  ClipboardCheck,
  LineChart,
  FileSearch,
  Database,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn.js';
import { Button } from '@/components/ui/button.js';
import { ThemeToggle } from './ThemeToggle.js';
import { useAuth } from '@/providers/AuthProvider.js';

type NavItem = {
  href?: string;
  label?: string;
  title?: string;
  icon: LucideIcon;
  perm?: string;
  items?: NavItem[];
};

type NavSection = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  perm?: string;
};

/**
 * Sustainability-first enterprise navigation.
 *
 * Legacy Worker Experience / Communication / AI Copilot / Operations modules are
 * intentionally NOT listed here. They remain in the codebase and are still
 * reachable by direct URL for future Enterprise Edition support.
 */
const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    perm: 'dashboard:read',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard:read' },
      { href: '/search', label: 'Global Search', icon: Search, perm: 'search:read' },
    ],
  },
  {
    title: 'Sustainability',
    icon: Leaf,
    perm: 'sustainability:read',
    items: [
      { href: '/sustainability', label: 'Overview', icon: LayoutDashboard, perm: 'sustainability:read' },
      { href: '/sustainability/programs', label: 'Programs', icon: Recycle, perm: 'sustainability:read' },
      { href: '/sustainability/goals', label: 'Goals', icon: Target, perm: 'sustainability:read' },
      { href: '/sustainability/kpis', label: 'KPIs', icon: TrendingUp, perm: 'sustainability:read' },
      { href: '/sustainability/initiatives', label: 'Initiatives', icon: Rocket, perm: 'sustainability:read' },
      { href: '/sustainability/reports', label: 'Reports', icon: FileText, perm: 'sustainability:read' },
    ],
  },
  {
    title: 'Carbon & GHG',
    icon: Recycle,
    perm: 'carbon:read',
    items: [
      { href: '/carbon', label: 'Dashboard', icon: LayoutDashboard, perm: 'carbon:read' },
      { href: '/carbon/emissions', label: 'Activity Data', icon: FileText, perm: 'carbon:read' },
      { href: '/carbon/emission-factors', label: 'Emission Factors', icon: CalculatorIcon, perm: 'carbon:read' },
      { href: '/carbon/scopes?scope=1', label: 'Scope 1', icon: Layers, perm: 'carbon:read' },
      { href: '/carbon/scopes?scope=2', label: 'Scope 2', icon: Layers, perm: 'carbon:read' },
      { href: '/carbon/scopes?scope=3', label: 'Scope 3', icon: Layers, perm: 'carbon:read' },
      { href: '/carbon/targets', label: 'SBTi Targets', icon: TargetIcon, perm: 'carbon:read' },
      { href: '/carbon/projects', label: 'Carbon Projects', icon: Rocket, perm: 'carbon:read' },
      { href: '/carbon/offsets', label: 'Carbon Offsets', icon: TreePine, perm: 'carbon:read' },
      { href: '/carbon/reports', label: 'Reports', icon: FileBarChart, perm: 'carbon:read' },
      { href: '/carbon/calculator', label: 'Calculator', icon: CalculatorIcon, perm: 'carbon:read' },
    ],
  },
  {
    title: 'Environmental',
    icon: Globe,
    perm: 'environment:read',
    items: [
      { href: '/dashboard/environment', label: 'ISO 14001', icon: ShieldIcon, perm: 'environment:read' },
      { href: '/dashboard/environment/water', label: 'Water', icon: Droplets, perm: 'environment:read' },
      { href: '/dashboard/environment/waste', label: 'Waste', icon: Trash2, perm: 'environment:read' },
      { href: '/dashboard/environment/air', label: 'Air', icon: Wind, perm: 'environment:read' },
      { href: '/dashboard/environment/chemicals', label: 'Chemicals', icon: FlaskConical, perm: 'environment:read' },
      { href: '/dashboard/environment/biodiversity', label: 'Biodiversity', icon: TreePine, perm: 'environment:read' },
      { href: '/dashboard/environment/incidents', label: 'Incidents', icon: AlertTriangle, perm: 'environment:read' },
      { href: '/dashboard/environment/permits', label: 'Permits', icon: FileCheck, perm: 'environment:read' },
      { href: '/dashboard/environment/objectives', label: 'Objectives', icon: Target, perm: 'environment:read' },
      { href: '/dashboard/environment/reports', label: 'Reports', icon: FileText, perm: 'environment:read' },
    ],
  },
  {
    title: 'ESG',
    icon: BookOpen,
    perm: 'esg:read',
    items: [
      { href: '/dashboard/esg', label: 'ESG Dashboard', icon: LayoutDashboard, perm: 'esg:read' },
      { href: '/dashboard/esg/reports', label: 'ESG Reporting', icon: FileBarChart, perm: 'esg:read' },
      { href: '/dashboard/esg/frameworks?code=gri', label: 'GRI', icon: GitBranch, perm: 'esg:read' },
      { href: '/dashboard/esg/frameworks?code=ifrs_s1', label: 'IFRS S1', icon: GitBranch, perm: 'esg:read' },
      { href: '/dashboard/esg/frameworks?code=ifrs_s2', label: 'IFRS S2', icon: GitBranch, perm: 'esg:read' },
      { href: '/dashboard/esg/frameworks?code=issb', label: 'ISSB', icon: GitBranch, perm: 'esg:read' },
      { href: '/dashboard/esg/materiality', label: 'Materiality Assessment', icon: TargetIcon, perm: 'esg:read' },
      { href: '/dashboard/esg/reports', label: 'Report Builder', icon: LayoutTemplate, perm: 'esg:read' },
      { href: '/dashboard/esg/metrics', label: 'Metrics', icon: TrendingUp, perm: 'esg:read' },
      { href: '/dashboard/esg/periods', label: 'Reporting Periods', icon: ClipboardList, perm: 'esg:read' },
      { href: '/dashboard/esg/disclosures', label: 'Disclosures', icon: FileText, perm: 'esg:read' },
      { href: '/dashboard/esg/assurance', label: 'Assurance', icon: ShieldCheck, perm: 'esg:read' },
    ],
  },
  {
    title: 'Suppliers',
    icon: Truck,
    perm: 'supplier:read',
    items: [
      { href: '/suppliers', label: 'Supplier Dashboard', icon: LayoutDashboard, perm: 'supplier:read' },
      { href: '/supplier-esg', label: 'Supplier ESG', icon: BookOpen, perm: 'supplier:read' },
      { href: '/responsible-sourcing', label: 'Responsible Sourcing', icon: Globe, perm: 'supplier:read' },
      { href: '/supplier-carbon', label: 'Supplier Carbon', icon: Recycle, perm: 'supplier:read' },
      { href: '/supplier-audits', label: 'Supplier Audits', icon: FileSearch, perm: 'supplier:read' },
      { href: '/supplier-risk', label: 'Supplier Risk', icon: AlertTriangle, perm: 'supplier:read' },
      { href: '/supplier-scorecards', label: 'Supplier Scorecards', icon: BarChart3, perm: 'supplier:read' },
    ],
  },
  {
    title: 'Data Hub',
    icon: Database,
    items: [
      { href: '/data-hub', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/data-hub/master-data', label: 'Master Data', icon: Database },
      { href: '/data-hub/sync', label: 'Sync Engine', icon: GitBranch },
      { href: '/data-hub/documents', label: 'Documents', icon: FileText },
      { href: '/data-hub/imports', label: 'Imports', icon: FolderOpen },
      { href: '/data-hub/validation', label: 'Validation Queue', icon: ClipboardCheck },
      { href: '/data-hub/queue', label: 'Processing Queue', icon: Layers },
      { href: '/data-hub/timeline', label: 'Activity Timeline', icon: LineChart },
      { href: '/data-hub/settings', label: 'Settings', icon: Settings2 },
    ],
  },
  {
    title: 'Compliance',
    icon: ShieldCheck,
    perm: 'compliance:read',
    items: [
      { href: '/audits', label: 'Audits', icon: FileSearch, perm: 'audit:read' },
      { href: '/capa', label: 'CAPA', icon: ShieldAlert, perm: 'capa:read' },
      { href: '/risk', label: 'Risks', icon: AlertTriangle, perm: 'risk:read' },
      { href: '/policies', label: 'Policies', icon: FileText, perm: 'standard:read' },
      { href: '/documents', label: 'Documents', icon: FolderOpen, perm: 'organization:read' },
      { href: '/standards', label: 'Standards', icon: ShieldCheck, perm: 'standard:read' },
      { href: '/assessments', label: 'Assessments', icon: ClipboardCheck, perm: 'assessment:read' },
    ],
  },
  {
    title: 'Analytics',
    icon: LineChart,
    perm: 'analytics:read',
    items: [
      { href: '/analytics', label: 'Analytics', icon: BarChart3, perm: 'analytics:read' },
      { href: '/executive', label: 'Executive Intelligence', icon: BarChart3, perm: 'analytics:read' },
      { href: '/compliance-score', label: 'Compliance Score', icon: Gauge, perm: 'analytics:read' },
      { href: '/reports', label: 'Reports', icon: FileText, perm: 'report:read' },
    ],
  },
  {
    title: 'Administration',
    icon: Settings2,
    perm: 'admin:read',
    items: [
      { href: '/admin/organizations', label: 'Organizations', icon: Building2, perm: 'org:read' },
      { href: '/admin/sites', label: 'Sites / Factories', icon: Factory, perm: 'site:read' },
      { href: '/admin/users', label: 'Users', icon: Users, perm: 'user:read' },
      { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'role:read' },
      { href: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert, perm: 'audit:read' },
      { href: '/settings/profile', label: 'Settings', icon: Settings2, perm: 'setting:read' },
    ],
  },
];

function stripQuery(href: string): string {
  return href.split('?')[0];
}

function isActive(pathname: string, href: string): boolean {
  if (!href) return false;
  const target = stripQuery(href);
  if (target === '/dashboard') return pathname === '/dashboard';
  return pathname === target || pathname.startsWith(target + '/');
}

function hasActiveChild(items: NavItem[], pathname: string): boolean {
  return items.some((item) => {
    if (item.items) return hasActiveChild(item.items, pathname);
    if (!item.href) return false;
    return isActive(pathname, item.href);
  });
}

/**
 * Navigation visibility is intentionally NOT permission-gated.
 *
 * ComplianceOS AI is a Sustainability-first enterprise platform; the full
 * product tree must always render so all modules are discoverable.
 * RBAC remains enforced server-side (APIs) and by the RouteGuard on routes.
 */
function filterNavSections(sections: NavSection[]): NavSection[] {
  return sections;
}

interface NavItemProps {
  item: NavItem;
  pathname: string;
  depth?: number;
}

function NavItemComponent({ item, pathname, depth = 0 }: NavItemProps) {
  const [expanded, setExpanded] = useState(() => hasActiveChild([item], pathname));
  const hasChildren = item.items && item.items.length > 0;
  const active = item.href ? isActive(pathname, item.href) : false;
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            depth > 0 ? 'ml-4' : '',
            expanded || hasActiveChild(item.items || [], pathname)
              ? 'text-[rgb(var(--text))]'
              : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2))]',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.title ?? item.label}</span>
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        </button>
        {expanded && (
          <div className="mt-1 space-y-0.5">
            {item.items?.map((child) => (
              <NavItemComponent key={child.href} item={child} pathname={pathname} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        depth > 0 ? 'ml-4' : '',
        active
          ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] font-medium'
          : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--panel-2))]',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function DashboardNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  const visibleSections = useMemo(() => {
    return filterNavSections(NAV_SECTIONS);
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--primary))]">
            <Leaf className="h-4 w-4 text-[rgb(var(--primary-foreground))]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">ComplianceOS AI</p>
            <p className="truncate text-xs text-[rgb(var(--muted))]">{session?.organization.name}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2" aria-label="Main navigation">
        {visibleSections.map((section) => {
          const SectionIcon = section.icon;
          const isExpanded = collapsedSections[section.title] ?? hasActiveChild(section.items, pathname);
          return (
            <div key={section.title} className="mb-1">
              <button
                type="button"
                onClick={() => setCollapsedSections((v) => ({ ...v, [section.title]: !v[section.title] }))}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                  isExpanded ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]',
                )}
              >
                <SectionIcon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{section.title}</span>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              </button>
              {isExpanded && (
                <div className="mt-1 space-y-0.5">
                  {section.items.map((item) => (
                    <NavItemComponent key={item.href} item={item} pathname={pathname} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[rgb(var(--border-color))] pt-3">
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
        className="fixed left-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] text-[rgb(var(--text))] shadow-sm md:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] md:block">
        <div className="flex h-full flex-col">{sidebarContent}</div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] shadow-xl">
            <div className="flex h-full flex-col">{sidebarContent}</div>
          </aside>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto md:ml-64">{children}</main>
    </div>
  );
}

