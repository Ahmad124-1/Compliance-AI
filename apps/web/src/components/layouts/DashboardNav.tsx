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
  Briefcase,
  QrCode,
  BarChart3,
  MessageSquare,
  Settings2,
  ListChecks,
  Search,
  ShieldAlert,
  Cpu,
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
  Users2,
  CalendarDays,
  Inbox,
  FileText,
  Droplets,
  Trash2,
  Wind,
  FlaskConical,
  Shield as ShieldIcon,
  FileCheck,
  Zap,
  TreePine,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  User,
  Globe,
  Scale3d,
  Workflow,
  LineChart,
  PieChart,
  Cog as CalculatorIcon,
  Cog,
  BookMarked,
  MessageCircle,
  ClipboardCheck,
  Target as TargetIcon,
  Award,
  Heart,
  Megaphone,
  FolderOpen,
  GraduationCap,
  LifeBuoy,
  BarChart2,
  FileBarChart,
  GitBranch,
  Bot,
  FileSearch,
  ExternalLink,
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

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    perm: 'dashboard:read',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard:read' },
      { href: '/executive', label: 'Executive Dashboard', icon: BarChart3, perm: 'analytics:read' },
      { href: '/search', label: 'Global Search', icon: Search, perm: 'search:read' },
    ],
  },
  {
    title: 'Worker Experience',
    icon: Users,
    perm: 'worker:read',
    items: [
      {
        title: 'Worker Voice',
        icon: Scale,
        perm: 'grievance:read',
        items: [
          { href: '/worker-voice', label: 'Worker Voice', icon: Scale, perm: 'grievance:read' },
          { href: '/worker-voice/my-cases', label: 'My Cases', icon: Briefcase, perm: 'case:read' },
          { href: '/worker-voice/report', label: 'Report Concern', icon: FileText, perm: 'grievance:create' },
          { href: '/worker-voice/hotline', label: 'Ethics Hotline', icon: Phone, perm: 'organization:read' },
          { href: '/worker-voice/ai-assistant', label: 'AI Worker Assistant', icon: Headphones, perm: 'ai:read' },
          { href: '/worker-voice/knowledge-center', label: 'Knowledge Center', icon: BookOpen, perm: 'organization:read' },
          { href: '/worker-voice/emergency-help', label: 'Emergency Help', icon: Siren, perm: 'organization:read' },
        ],
      },
      {
        title: 'Worker Communication',
        icon: MessageSquare,
        perm: 'case:read',
        items: [
          { href: '/worker-communication', label: 'Worker Comms', icon: MessageSquare, perm: 'case:read' },
        ],
      },
      {
        title: 'AI Worker Assistant',
        icon: Bot,
        perm: 'ai:read',
        items: [
          { href: '/worker-ai', label: 'AI Worker Assistant', icon: Bot, perm: 'ai:read' },
          { href: '/worker-ai/documents', label: 'Documents', icon: FileText, perm: 'ai:read' },
          { href: '/worker-ai/emergency', label: 'Emergency', icon: Siren, perm: 'ai:read' },
          { href: '/worker-ai/rights', label: 'Rights', icon: ShieldIcon, perm: 'ai:read' },
          { href: '/worker-ai/training', label: 'Training', icon: GraduationCap, perm: 'ai:read' },
        ],
      },
      {
        title: 'Workers',
        icon: Users2,
        perm: 'worker:read',
        items: [
          { href: '/workers', label: 'Workers', icon: Users2, perm: 'worker:read' },
          { href: '/workers/overview', label: 'Overview', icon: LayoutDashboard, perm: 'worker:read' },
          { href: '/workers/profile', label: 'Profile', icon: User, perm: 'worker:read' },
          { href: '/workers/directory', label: 'Directory', icon: BookOpen, perm: 'worker:read' },
          { href: '/workers/announcements', label: 'Announcements', icon: Megaphone, perm: 'worker:read' },
          { href: '/workers/tasks', label: 'Tasks', icon: ClipboardCheck, perm: 'worker:read' },
          { href: '/workers/documents', label: 'Documents', icon: FolderOpen, perm: 'worker:read' },
          { href: '/workers/forms', label: 'Forms', icon: FileText, perm: 'worker:read' },
          { href: '/workers/learning', label: 'Learning', icon: GraduationCap, perm: 'worker:read' },
          { href: '/workers/support', label: 'Support', icon: LifeBuoy, perm: 'worker:read' },
          { href: '/workers/settings', label: 'Settings', icon: Cog, perm: 'worker:read' },
          {
            title: 'Engagement',
            icon: Heart,
            perm: 'engagement:read',
            items: [
              { href: '/workers/engagement', label: 'Engagement', icon: Heart, perm: 'engagement:read' },
              { href: '/workers/engagement/surveys', label: 'Surveys', icon: ClipboardList, perm: 'engagement:read' },
              { href: '/workers/engagement/recognition', label: 'Recognition', icon: Award, perm: 'engagement:read' },
              { href: '/workers/engagement/wellbeing', label: 'Wellbeing', icon: Heart, perm: 'engagement:read' },
              { href: '/workers/engagement/goals', label: 'Goals', icon: Target, perm: 'engagement:read' },
              { href: '/workers/engagement/community', label: 'Community', icon: Users2, perm: 'engagement:read' },
              { href: '/workers/engagement/events', label: 'Events', icon: CalendarDays, perm: 'engagement:read' },
              { href: '/workers/engagement/analytics', label: 'Analytics', icon: BarChart2, perm: 'engagement:read' },
            ],
          },
        ],
      },
    ],
  },
  {
    title: 'Compliance',
    icon: ShieldCheck,
    perm: 'compliance:read',
    items: [
      {
        title: 'Assessments',
        icon: ClipboardCheck,
        perm: 'assessment:read',
        items: [
          { href: '/assessments', label: 'Assessments', icon: ClipboardCheck, perm: 'assessment:read' },
          { href: '/assessments/templates', label: 'Templates', icon: LayoutTemplate, perm: 'assessment:read' },
          { href: '/assessments/library/[id]', label: 'Library', icon: BookMarked, perm: 'assessment:read' },
        ],
      },
      {
        title: 'Standards',
        icon: ShieldCheck,
        perm: 'standard:read',
        items: [
          { href: '/standards', label: 'Standards', icon: ShieldCheck, perm: 'standard:read' },
          { href: '/standards/[id]', label: 'Standard Detail', icon: FileSearch, perm: 'standard:read' },
          { href: '/standards/frameworks/[id]', label: 'Framework Detail', icon: GitBranch, perm: 'standard:read' },
        ],
      },
      {
        title: 'Audits',
        icon: FileSearch,
        perm: 'audit:read',
        items: [
          { href: '/audits', label: 'Audits', icon: FileSearch, perm: 'audit:read' },
          { href: '/audits/[id]', label: 'Audit Detail', icon: ExternalLink, perm: 'audit:read' },
        ],
      },
      {
        title: 'Cases',
        icon: Briefcase,
        perm: 'case:read',
        items: [
          { href: '/admin/cases', label: 'Cases', icon: Briefcase, perm: 'case:read' },
          { href: '/admin/cases/[id]', label: 'Case Detail', icon: ExternalLink, perm: 'case:read' },
        ],
      },
      {
        title: 'Findings & CAPA',
        icon: ShieldAlert,
        perm: 'capa:read',
        items: [
          { href: '/capa', label: 'Findings & CAPA', icon: ShieldAlert, perm: 'capa:read' },
        ],
      },
      {
        title: 'Escalation',
        icon: Siren,
        perm: 'case:read',
        items: [
          { href: '/escalation', label: 'Escalation', icon: Siren, perm: 'case:read' },
        ],
      },
      {
        title: 'Grievances',
        icon: FileText,
        perm: 'grievance:read',
        items: [
          { href: '/grievances', label: 'Grievances', icon: FileText, perm: 'grievance:read' },
          { href: '/admin/grievances', label: 'Admin Grievances', icon: FileText, perm: 'grievance:read' },
          { href: '/admin/grievances/categories', label: 'Categories', icon: ListChecks, perm: 'grievance:read' },
          { href: '/admin/grievances/portal-config', label: 'Portal Config', icon: Settings2, perm: 'grievance:read' },
          { href: '/admin/grievances/qr-portals', label: 'QR Portals', icon: QrCode, perm: 'grievance:read' },
          { href: '/track-grievance', label: 'Track Grievance', icon: Search, perm: 'grievance:read' },
        ],
      },
      { href: '/compliance-score', label: 'Compliance Score', icon: Gauge, perm: 'analytics:read' },
    ],
  },
  {
    title: 'AI Compliance Copilot',
    icon: Bot,
    perm: 'ai:read',
    items: [
      { href: '/ai', label: 'Dashboard', icon: Bot, perm: 'ai:read' },
      { href: '/ai/overview', label: 'Overview', icon: LayoutDashboard, perm: 'ai:read' },
      { href: '/ai/chat', label: 'Ask AI', icon: MessageCircle, perm: 'ai:read' },
      { href: '/ai/document-ai', label: 'Document Intelligence', icon: FileSearch, perm: 'ai:read' },
      { href: '/ai/knowledge-base', label: 'Knowledge Base', icon: BookMarked, perm: 'ai:read' },
      { href: '/ai/policy-generator', label: 'Policy Assistant', icon: FileText, perm: 'ai:read' },
      { href: '/ai/audit-assistant', label: 'Audit Assistant', icon: ShieldAlert, perm: 'ai:read' },
      { href: '/ai/predictive', label: 'Risk Advisor', icon: TrendingUp, perm: 'ai:read' },
      { href: '/ai/autonomous', label: 'Workflow Builder', icon: Workflow, perm: 'ai:read' },
      { href: '/ai/analytics', label: 'Analytics', icon: BarChart2, perm: 'ai:read' },
      { href: '/ai/clause-explorer', label: 'Clause Explorer', icon: FileSearch, perm: 'ai:read' },
      { href: '/ai/conversations', label: 'Conversations', icon: MessageCircle, perm: 'ai:read' },
      { href: '/ai/settings', label: 'Settings', icon: Cog, perm: 'ai:read' },
    ],
  },
  {
    title: 'Sustainability',
    icon: Leaf,
    perm: 'sustainability:read',
    items: [
      {
        title: 'Sustainability',
        icon: Leaf,
        perm: 'sustainability:read',
        items: [
          { href: '/dashboard/sustainability', label: 'Dashboard', icon: LayoutDashboard, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/programs', label: 'Programs', icon: Recycle, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/goals', label: 'ESG Goals', icon: Target, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/kpis', label: 'KPIs', icon: TrendingUp, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/initiatives', label: 'Initiatives', icon: Rocket, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/reports', label: 'Reports', icon: FileText, perm: 'sustainability:read' },
          { href: '/dashboard/sustainability/settings', label: 'Settings', icon: Settings2, perm: 'sustainability:read' },
        ],
      },
      {
        title: 'Carbon & GHG',
        icon: Recycle,
        perm: 'carbon:read',
        items: [
          { href: '/dashboard/carbon', label: 'Carbon & GHG', icon: Recycle, perm: 'carbon:read' },
          { href: '/dashboard/carbon/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'carbon:read' },
          { href: '/dashboard/carbon/facilities', label: 'Facilities', icon: Factory, perm: 'carbon:read' },
          { href: '/dashboard/carbon/emission-sources', label: 'Emission Sources', icon: Zap, perm: 'carbon:read' },
          { href: '/dashboard/carbon/scopes', label: 'GHG Scopes', icon: Layers, perm: 'carbon:read' },
          { href: '/dashboard/carbon/emissions', label: 'Emissions', icon: Zap, perm: 'carbon:read' },
          { href: '/dashboard/carbon/emission-factors', label: 'Emission Factors', icon: CalculatorIcon, perm: 'carbon:read' },
          { href: '/dashboard/carbon/projects', label: 'Reduction Projects', icon: Rocket, perm: 'carbon:read' },
          { href: '/dashboard/carbon/offsets', label: 'Carbon Offsets', icon: TreePine, perm: 'carbon:read' },
          { href: '/dashboard/carbon/targets', label: 'Reduction Targets', icon: Target, perm: 'carbon:read' },
          { href: '/dashboard/carbon/reports', label: 'Carbon Reports', icon: FileText, perm: 'carbon:read' },
          { href: '/dashboard/carbon/calculator', label: 'Calculator', icon: CalculatorIcon, perm: 'carbon:read' },
        ],
      },
      {
        title: 'Environmental',
        icon: Leaf,
        perm: 'environment:read',
        items: [
          { href: '/dashboard/environment', label: 'Environmental', icon: Leaf, perm: 'environment:read' },
          { href: '/dashboard/environment/air', label: 'Air', icon: Wind, perm: 'environment:read' },
          { href: '/dashboard/environment/chemicals', label: 'Chemicals', icon: FlaskConical, perm: 'environment:read' },
          { href: '/dashboard/environment/incidents', label: 'Incidents', icon: AlertTriangle, perm: 'environment:read' },
          { href: '/dashboard/environment/permits', label: 'Permits', icon: FileCheck, perm: 'environment:read' },
          { href: '/dashboard/environment/projects', label: 'Biodiversity', icon: TreePine, perm: 'environment:read' },
          { href: '/dashboard/environment/resources', label: 'Resources', icon: Zap, perm: 'environment:read' },
          { href: '/dashboard/environment/risks', label: 'Risk Register', icon: ShieldIcon, perm: 'environment:read' },
          { href: '/dashboard/environment/settings', label: 'EMS Settings', icon: Settings2, perm: 'environment:read' },
          { href: '/dashboard/environment/waste', label: 'Waste', icon: Trash2, perm: 'environment:read' },
          { href: '/dashboard/environment/water', label: 'Water', icon: Droplets, perm: 'environment:read' },
        ],
      },
      {
        title: 'ESG Reporting',
        icon: BookOpen,
        perm: 'esg:read',
        items: [
          { href: '/dashboard/esg', label: 'ESG Reporting', icon: BookOpen, perm: 'esg:read' },
          { href: '/dashboard/esg/frameworks', label: 'Frameworks', icon: GitBranch, perm: 'esg:read' },
          { href: '/dashboard/esg/metrics', label: 'Metrics', icon: TrendingUp, perm: 'esg:read' },
          { href: '/dashboard/esg/periods', label: 'Periods', icon: ClipboardList, perm: 'esg:read' },
          { href: '/dashboard/esg/disclosures', label: 'Disclosures', icon: FileText, perm: 'esg:read' },
          { href: '/dashboard/esg/reports', label: 'ESG Reports', icon: FileBarChart, perm: 'esg:read' },
          { href: '/dashboard/esg/materiality', label: 'Materiality', icon: TargetIcon, perm: 'esg:read' },
          { href: '/dashboard/esg/assurance', label: 'Assurance', icon: ShieldCheck, perm: 'esg:read' },
          { href: '/dashboard/esg/data-points', label: 'Data Points', icon: PieChart, perm: 'esg:read' },
        ],
      },
    ],
  },
  {
    title: 'Analytics',
    icon: LineChart,
    perm: 'analytics:read',
    items: [
      { href: '/analytics', label: 'Compliance Analytics', icon: BarChart3, perm: 'analytics:read' },
      { href: '/executive', label: 'Executive Intelligence', icon: BarChart3, perm: 'analytics:read' },
    ],
  },
  {
    title: 'Reports',
    icon: FileText,
    perm: 'report:read',
    items: [
      { href: '/reports', label: 'Compliance Reports', icon: FileText, perm: 'report:read' },
      { href: '/dashboard/carbon/reports', label: 'Carbon Reports', icon: Recycle, perm: 'carbon:read' },
      { href: '/dashboard/environment', label: 'Environmental Reports', icon: Leaf, perm: 'environment:read' },
      { href: '/dashboard/esg/reports', label: 'ESG Reports', icon: BookOpen, perm: 'esg:read' },
      { href: '/dashboard/sustainability/reports', label: 'Sustainability Reports', icon: TargetIcon, perm: 'sustainability:read' },
      { href: '/standards', label: 'Standards Reports', icon: ShieldCheck, perm: 'standard:read' },
    ],
  },
  {
    title: 'Administration',
    icon: Settings2,
    perm: 'admin:read',
    items: [
      { href: '/admin/users', label: 'Users', icon: Users, perm: 'user:read' },
      { href: '/admin/organizations', label: 'Organizations', icon: Building2, perm: 'org:read' },
      { href: '/admin/sites', label: 'Sites', icon: Factory, perm: 'site:read' },
      { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'role:read' },
      {
        title: 'Grievances',
        icon: FileText,
        perm: 'grievance:read',
        items: [
          { href: '/admin/grievances', label: 'Grievances', icon: FileText, perm: 'grievance:read' },
          { href: '/admin/grievances/categories', label: 'Categories', icon: ListChecks, perm: 'grievance:read' },
          { href: '/admin/grievances/portal-config', label: 'Portal Config', icon: Settings2, perm: 'grievance:read' },
          { href: '/admin/grievances/qr-portals', label: 'QR Portals', icon: QrCode, perm: 'grievance:read' },
        ],
      },
      { href: '/admin/cases', label: 'Cases', icon: Briefcase, perm: 'case:read' },
      { href: '/admin/audit', label: 'Audit Trail', icon: ShieldAlert, perm: 'audit:read' },
      { href: '/admin/security', label: 'Security Review', icon: ShieldCheck, perm: 'organization:read' },
      { href: '/admin/ai', label: 'AI Foundation', icon: Cpu, perm: 'ai:read' },
      { href: '/communication-settings', label: 'Communication Settings', icon: Settings2, perm: 'organization:read' },
    ],
  },
  {
    title: 'Risk & Operations',
    icon: AlertTriangle,
    perm: 'risk:read',
    items: [
      { href: '/risk', label: 'Risk', icon: AlertTriangle, perm: 'risk:read' },
      { href: '/factory', label: 'Factories', icon: Factory, perm: 'site:read' },
      { href: '/supplier', label: 'Suppliers', icon: Truck, perm: 'supplier:read' },
      { href: '/supplier-audits', label: 'Supplier Audits', icon: FileSearch, perm: 'supplier:read' },
      { href: '/supplier-carbon', label: 'Supplier Carbon', icon: Recycle, perm: 'supplier:read' },
      { href: '/supplier-esg', label: 'Supplier ESG', icon: BookOpen, perm: 'supplier:read' },
      { href: '/supplier-risk', label: 'Supplier Risk', icon: AlertTriangle, perm: 'supplier:read' },
      { href: '/supplier-scorecards', label: 'Supplier Scorecards', icon: BarChart3, perm: 'supplier:read' },
      { href: '/responsible-sourcing', label: 'Responsible Sourcing', icon: Globe, perm: 'supplier:read' },
      { href: '/certifications', label: 'Certifications', icon: Award, perm: 'certification:read' },
      { href: '/qr-codes', label: 'QR Codes', icon: QrCode, perm: 'qr:read' },
    ],
  },
  {
    title: 'Communication Hub',
    icon: Mail,
    perm: 'communication:read',
    items: [
      { href: '/communication-hub', label: 'Dashboard', icon: Mail, perm: 'communication:read' },
      { href: '/communication-hub/inbox', label: 'Inbox', icon: Inbox, perm: 'communication:read' },
      { href: '/communication-hub/chat', label: 'Chat', icon: MessageSquare, perm: 'communication:read' },
      { href: '/communication-hub/broadcasts', label: 'Broadcasts', icon: Megaphone, perm: 'communication:read' },
      { href: '/communication-hub/emergency', label: 'Emergency Center', icon: Siren, perm: 'communication:read' },
      { href: '/communication-hub/calendar', label: 'Calendar', icon: CalendarDays, perm: 'communication:read' },
      { href: '/communication-hub/analytics', label: 'Analytics', icon: BarChart3, perm: 'communication:read' },
      { href: '/communication-hub/manager', label: 'Manager Dashboard', icon: Users2, perm: 'communication:read' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings2,
    perm: 'setting:read',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: User, perm: 'setting:read' },
      { href: '/notifications', label: 'Notifications', icon: Bell, perm: 'organization:read' },
      { href: '/sla', label: 'SLA', icon: Timer, perm: 'organization:read' },
      { href: '/templates', label: 'Templates', icon: LayoutTemplate, perm: 'organization:read' },
      { href: '/queue', label: 'Queue', icon: ListChecks, perm: 'queue:read' },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (!href) return false;
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(href + '/');
}

function hasActiveChild(items: NavItem[], pathname: string): boolean {
  return items.some((item) => {
    if (item.items) return hasActiveChild(item.items, pathname);
    if (!item.href) return false;
    return isActive(pathname, item.href);
  });
}

function filterNavSections(sections: NavSection[], hasPermission: (...keys: string[]) => boolean): NavSection[] {
  return sections.filter((section) => {
    if (!section.perm) return true;
    return filterByPermission(section.items ?? [], hasPermission).length > 0;
  }).map((section) => ({
    ...section,
    items: filterByPermission(section.items ?? [], hasPermission),
  }));
}

function filterByPermission(items: NavItem[], hasPermission: (...keys: string[]) => boolean): NavItem[] {
  return items.filter((item) => {
    if (!item.perm) return true;
    if (item.items) return filterByPermission(item.items, hasPermission).length > 0;
    return hasPermission(item.perm);
  });
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
  const { session, hasPermission, logout } = useAuth();
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
    return filterNavSections(NAV_SECTIONS, hasPermission);
  }, [hasPermission]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--primary))]">
            <Scale3d className="h-4 w-4 text-[rgb(var(--primary-foreground))]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">ComplianceOS</p>
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
