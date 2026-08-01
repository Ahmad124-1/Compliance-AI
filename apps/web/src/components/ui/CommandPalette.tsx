'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  Users,
  ShieldCheck,
  Factory,
  BarChart3,
  AlertTriangle,
  Truck,
  Bot,
  Leaf,
  Recycle,
  Globe,
  Droplets,
  Trash2,
  Wind,
  FlaskConical,
  TreePine,
  BookOpen,
  FileBarChart,
  GitBranch,
  Target,
  Rocket,
  LayoutDashboard,
  ShieldAlert,
  FolderOpen,
  ClipboardCheck,
  LineChart,
  Gauge,
  Building2,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';

type CommandItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  category?: string;
  keywords?: string[];
};

const COMMANDS: CommandItem[] = [
  // Dashboard
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Dashboard', keywords: ['overview', 'home'] },
  { href: '/search', label: 'Global Search', icon: Search, category: 'Dashboard', keywords: ['find'] },

  // Sustainability
  { href: '/dashboard/sustainability', label: 'Sustainability Overview', icon: Leaf, category: 'Sustainability', keywords: ['esg', 'green'] },
  { href: '/dashboard/sustainability/programs', label: 'Sustainability Programs', icon: Recycle, category: 'Sustainability', keywords: ['programs'] },
  { href: '/dashboard/sustainability/goals', label: 'ESG Goals', icon: Target, category: 'Sustainability', keywords: ['goals'] },
  { href: '/dashboard/sustainability/kpis', label: 'KPIs', icon: LineChart, category: 'Sustainability', keywords: ['kpis', 'metrics'] },
  { href: '/dashboard/sustainability/initiatives', label: 'Initiatives', icon: Rocket, category: 'Sustainability', keywords: ['initiatives'] },
  { href: '/dashboard/sustainability/reports', label: 'Sustainability Reports', icon: FileText, category: 'Sustainability', keywords: ['reports'] },

  // Carbon & GHG
  { href: '/dashboard/carbon', label: 'Carbon & GHG', icon: Recycle, category: 'Carbon & GHG', keywords: ['carbon', 'emissions', 'ghg'] },
  { href: '/dashboard/carbon/emissions', label: 'Activity Data', icon: FileText, category: 'Carbon & GHG', keywords: ['activity', 'data'] },
  { href: '/dashboard/carbon/emission-factors', label: 'Emission Factors', icon: BarChart3, category: 'Carbon & GHG', keywords: ['factors'] },
  { href: '/dashboard/carbon/scopes', label: 'GHG Scopes', icon: Globe, category: 'Carbon & GHG', keywords: ['scope', 'scopes'] },
  { href: '/dashboard/carbon/targets', label: 'SBTi Targets', icon: Target, category: 'Carbon & GHG', keywords: ['sbti', 'targets'] },
  { href: '/dashboard/carbon/projects', label: 'Carbon Projects', icon: Rocket, category: 'Carbon & GHG', keywords: ['projects', 'reduction'] },
  { href: '/dashboard/carbon/offsets', label: 'Carbon Offsets', icon: TreePine, category: 'Carbon & GHG', keywords: ['offsets', 'credits'] },
  { href: '/dashboard/carbon/reports', label: 'Carbon Reports', icon: FileBarChart, category: 'Carbon & GHG', keywords: ['carbon reports'] },
  { href: '/dashboard/carbon/calculator', label: 'Carbon Calculator', icon: BarChart3, category: 'Carbon & GHG', keywords: ['calculator'] },

  // Environmental
  { href: '/dashboard/environment', label: 'Environmental (ISO 14001)', icon: Globe, category: 'Environmental', keywords: ['environment', 'ems', 'iso 14001'] },
  { href: '/dashboard/environment/water', label: 'Water', icon: Droplets, category: 'Environmental', keywords: ['water'] },
  { href: '/dashboard/environment/waste', label: 'Waste', icon: Trash2, category: 'Environmental', keywords: ['waste'] },
  { href: '/dashboard/environment/air', label: 'Air', icon: Wind, category: 'Environmental', keywords: ['air', 'emissions'] },
  { href: '/dashboard/environment/chemicals', label: 'Chemicals', icon: FlaskConical, category: 'Environmental', keywords: ['chemicals'] },
  { href: '/dashboard/environment/biodiversity', label: 'Biodiversity', icon: TreePine, category: 'Environmental', keywords: ['biodiversity'] },
  { href: '/dashboard/environment/incidents', label: 'Incidents', icon: AlertTriangle, category: 'Environmental', keywords: ['incidents'] },
  { href: '/dashboard/environment/permits', label: 'Permits', icon: ShieldCheck, category: 'Environmental', keywords: ['permits'] },
  { href: '/dashboard/environment/objectives', label: 'Objectives', icon: Target, category: 'Environmental', keywords: ['objectives'] },
  { href: '/dashboard/environment/reports', label: 'Environmental Reports', icon: FileText, category: 'Environmental', keywords: ['enviro reports'] },

  // ESG
  { href: '/dashboard/esg', label: 'ESG Dashboard', icon: BookOpen, category: 'ESG', keywords: ['esg', 'dashboard'] },
  { href: '/dashboard/esg/reports', label: 'ESG Reporting', icon: FileBarChart, category: 'ESG', keywords: ['esg reports'] },
  { href: '/dashboard/esg/frameworks', label: 'ESG Frameworks', icon: GitBranch, category: 'ESG', keywords: ['gri', 'ifrs', 'issb', 'sasb'] },
  { href: '/dashboard/esg/materiality', label: 'Materiality Assessment', icon: Target, category: 'ESG', keywords: ['materiality'] },
  { href: '/dashboard/esg/metrics', label: 'ESG Metrics', icon: LineChart, category: 'ESG', keywords: ['metrics'] },
  { href: '/dashboard/esg/disclosures', label: 'Disclosures', icon: FileText, category: 'ESG', keywords: ['disclosures'] },
  { href: '/dashboard/esg/assurance', label: 'Assurance', icon: ShieldCheck, category: 'ESG', keywords: ['assurance'] },

  // Suppliers
  { href: '/suppliers', label: 'Supplier Dashboard', icon: Truck, category: 'Suppliers', keywords: ['supplier', 'supply chain'] },
  { href: '/supplier-esg', label: 'Supplier ESG', icon: BookOpen, category: 'Suppliers', keywords: ['supplier esg'] },
  { href: '/responsible-sourcing', label: 'Responsible Sourcing', icon: Globe, category: 'Suppliers', keywords: ['responsible', 'sourcing'] },
  { href: '/supplier-carbon', label: 'Supplier Carbon', icon: Recycle, category: 'Suppliers', keywords: ['supplier carbon'] },
  { href: '/supplier-audits', label: 'Supplier Audits', icon: FileText, category: 'Suppliers', keywords: ['supplier audits'] },
  { href: '/supplier-risk', label: 'Supplier Risk', icon: AlertTriangle, category: 'Suppliers', keywords: ['supplier risk'] },
  { href: '/supplier-scorecards', label: 'Supplier Scorecards', icon: BarChart3, category: 'Suppliers', keywords: ['scorecards'] },

  // Compliance
  { href: '/audits', label: 'Audits', icon: FileText, category: 'Compliance', keywords: ['audit', 'check'] },
  { href: '/capa', label: 'CAPA', icon: ShieldAlert, category: 'Compliance', keywords: ['corrective', 'preventive'] },
  { href: '/risk', label: 'Risks', icon: AlertTriangle, category: 'Compliance', keywords: ['risk', 'threat'] },
  { href: '/policies', label: 'Policies', icon: FileText, category: 'Compliance', keywords: ['policy'] },
  { href: '/documents', label: 'Documents', icon: FolderOpen, category: 'Compliance', keywords: ['documents', 'docs'] },
  { href: '/standards', label: 'Standards', icon: ShieldCheck, category: 'Compliance', keywords: ['frameworks', 'rules', 'standards'] },
  { href: '/assessments', label: 'Assessments', icon: ClipboardCheck, category: 'Compliance', keywords: ['templates', 'audit'] },

  // Analytics
  { href: '/analytics', label: 'Analytics', icon: LineChart, category: 'Analytics', keywords: ['charts', 'data'] },
  { href: '/executive', label: 'Executive Intelligence', icon: BarChart3, category: 'Analytics', keywords: ['leadership', 'snapshot'] },
  { href: '/compliance-score', label: 'Compliance Score', icon: Gauge, category: 'Analytics', keywords: ['score', 'rating'] },
  { href: '/reports', label: 'Reports', icon: FileText, category: 'Analytics', keywords: ['export', 'pdf'] },

  // Administration
  { href: '/admin/users', label: 'Users', icon: Users, category: 'Administration', keywords: ['people', 'accounts'] },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2, category: 'Administration', keywords: ['org', 'company'] },
  { href: '/admin/sites', label: 'Sites / Factories', icon: Factory, category: 'Administration', keywords: ['factories', 'locations'] },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, category: 'Administration', keywords: ['rbac', 'access'] },

  // Legacy (still accessible)
  { href: '/ai', label: 'AI Compliance Copilot (Legacy)', icon: Bot, category: 'Legacy', keywords: ['ai', 'copilot'] },
  { href: '/worker-voice', label: 'Worker Voice', icon: FileText, category: 'Legacy', keywords: ['grievance', 'worker'] },
  { href: '/workers', label: 'Workers', icon: Users, category: 'Legacy', keywords: ['team', 'staff'] },
  { href: '/communication-hub', label: 'Communication Hub', icon: FolderOpen, category: 'Legacy', keywords: ['inbox', 'broadcast'] },
  { href: '/certifications', label: 'Certifications', icon: ShieldCheck, category: 'Legacy', keywords: ['cert', 'accreditation'] },
  { href: '/qr-codes', label: 'QR Codes', icon: FileText, category: 'Legacy', keywords: ['qr', 'scan'] },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        if (!open) {
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return COMMANDS.slice(0, 8);
    const q = query.toLowerCase();
    return COMMANDS.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.category ?? ''} ${(cmd.keywords ?? []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open || results.length === 0) return;
    const item = listRef.current?.querySelector<HTMLDivElement>(`[data-index="${selectedIndex}"]`);
    item?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedIndex, open, results.length]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) handleSelect(results[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] shadow-[var(--shadow-lg)]">
        <div className="flex items-center gap-3 border-b border-[rgb(var(--border-color))] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[rgb(var(--muted))]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, modules..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[rgb(var(--muted-2))]"
          />
          <kbd className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-1.5 py-0.5 text-xs text-[rgb(var(--muted))]">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="py-8 text-center text-sm text-[rgb(var(--muted))]">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((cmd, i) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.href}
                data-index={i}
                type="button"
                onClick={() => handleSelect(cmd.href)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  i === selectedIndex ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'hover:bg-[rgb(var(--panel-2))] text-[rgb(var(--text))]',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{cmd.label}</p>
                  {cmd.category && <p className={cn('text-xs', i === selectedIndex ? 'text-[rgb(var(--primary-foreground))] opacity-80' : 'text-[rgb(var(--muted))]')}>{cmd.category}</p>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-[rgb(var(--border-color))] px-4 py-2 text-xs text-[rgb(var(--muted))]">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-1 py-0.5">↑↓</kbd> to navigate</span>
            <span><kbd className="rounded border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-1 py-0.5">↵</kbd> to select</span>
          </div>
          <span><kbd className="rounded border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] px-1 py-0.5">CTRL K</kbd></span>
        </div>
      </div>
    </div>
  );
}
