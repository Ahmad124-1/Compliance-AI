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
  MessageSquare,
  ListChecks,
  AlertTriangle,
  Truck,
  QrCode,
  Bot,
  Leaf,
  CalendarDays,
  Inbox,
  Bell,
  GraduationCap,
  Award,
  Building2,
  Timer,
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
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3, category: 'Navigation', keywords: ['overview', 'home'] },
  { href: '/executive', label: 'Executive Dashboard', icon: BarChart3, category: 'Navigation', keywords: ['leadership', 'snapshot'] },
  { href: '/search', label: 'Global Search', icon: Search, category: 'Navigation', keywords: ['find'] },
  { href: '/worker-voice', label: 'Worker Voice', icon: ShieldCheck, category: 'Worker Experience', keywords: ['grievance', 'voice'] },
  { href: '/worker-voice/report', label: 'Report Concern', icon: FileText, category: 'Worker Experience', keywords: ['grievance', 'report'] },
  { href: '/worker-communication', label: 'Worker Communication', icon: MessageSquare, category: 'Worker Experience', keywords: ['comms', 'chat'] },
  { href: '/worker-ai', label: 'AI Worker Assistant', icon: Bot, category: 'Worker Experience', keywords: ['ai', 'assistant'] },
  { href: '/workers', label: 'Workers', icon: Users, category: 'Worker Experience', keywords: ['team', 'staff'] },
  { href: '/workers/engagement', label: 'Worker Engagement', icon: GraduationCap, category: 'Worker Experience', keywords: ['wellbeing', 'surveys'] },
  { href: '/assessments', label: 'Assessments', icon: ListChecks, category: 'Compliance', keywords: ['templates', 'audit'] },
  { href: '/standards', label: 'Standards', icon: ShieldCheck, category: 'Compliance', keywords: ['frameworks', 'rules'] },
  { href: '/audits', label: 'Audits', icon: FileText, category: 'Compliance', keywords: ['audit', 'check'] },
  { href: '/capa', label: 'Findings & CAPA', icon: AlertTriangle, category: 'Compliance', keywords: ['corrective', 'preventive'] },
  { href: '/escalation', label: 'Escalation', icon: AlertTriangle, category: 'Compliance', keywords: ['urgent', 'escalate'] },
  { href: '/grievances', label: 'Grievances', icon: FileText, category: 'Compliance', keywords: ['complaints'] },
  { href: '/compliance-score', label: 'Compliance Score', icon: BarChart3, category: 'Compliance', keywords: ['score', 'rating'] },
  { href: '/ai', label: 'AI Compliance Copilot', icon: Bot, category: 'AI', keywords: ['ai', 'copilot', 'assistant'] },
  { href: '/ai/chat', label: 'Ask AI', icon: MessageSquare, category: 'AI', keywords: ['chat', 'ask'] },
  { href: '/dashboard/sustainability', label: 'Sustainability', icon: Leaf, category: 'Sustainability', keywords: ['esg', 'green'] },
  { href: '/dashboard/carbon', label: 'Carbon & GHG', icon: Leaf, category: 'Sustainability', keywords: ['carbon', 'emissions'] },
  { href: '/dashboard/environment', label: 'Environmental', icon: Leaf, category: 'Sustainability', keywords: ['environment', 'ems'] },
  { href: '/dashboard/esg', label: 'ESG Reporting', icon: BarChart3, category: 'Sustainability', keywords: ['esg', 'reporting'] },
  { href: '/analytics', label: 'Compliance Analytics', icon: BarChart3, category: 'Analytics', keywords: ['charts', 'data'] },
  { href: '/reports', label: 'Reports & Exports', icon: FileText, category: 'Analytics', keywords: ['export', 'pdf'] },
  { href: '/admin/users', label: 'Users', icon: Users, category: 'Administration', keywords: ['people', 'accounts'] },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2, category: 'Administration', keywords: ['org', 'company'] },
  { href: '/admin/sites', label: 'Sites', icon: Factory, category: 'Administration', keywords: ['factories', 'locations'] },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, category: 'Administration', keywords: ['rbac', 'access'] },
  { href: '/risk', label: 'Risk', icon: AlertTriangle, category: 'Operations', keywords: ['risk', 'threat'] },
  { href: '/factory', label: 'Factories', icon: Factory, category: 'Operations', keywords: ['sites', 'plants'] },
  { href: '/supplier', label: 'Suppliers', icon: Truck, category: 'Operations', keywords: ['supply', 'chain'] },
  { href: '/communication-hub', label: 'Communication Hub', icon: MessageSquare, category: 'Communication', keywords: ['inbox', 'broadcast'] },
  { href: '/communication-hub/inbox', label: 'Inbox', icon: Inbox, category: 'Communication', keywords: ['messages', 'mail'] },
  { href: '/communication-hub/calendar', label: 'Calendar', icon: CalendarDays, category: 'Communication', keywords: ['schedule', 'events'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, category: 'Settings', keywords: ['alerts', 'notifications'] },
  { href: '/sla', label: 'SLA', icon: Timer, category: 'Settings', keywords: ['service', 'agreement'] },
  { href: '/templates', label: 'Templates', icon: ListChecks, category: 'Settings', keywords: ['forms', 'templates'] },
  { href: '/queue', label: 'Queue', icon: ListChecks, category: 'Settings', keywords: ['work', 'tasks'] },
  { href: '/qr-codes', label: 'QR Codes', icon: QrCode, category: 'Operations', keywords: ['qr', 'scan'] },
  { href: '/certifications', label: 'Certifications', icon: Award, category: 'Operations', keywords: ['cert', 'accreditation'] },
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
            placeholder="Search pages, actions, workers, cases..."
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
