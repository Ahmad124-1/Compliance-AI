'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Bot,
  Workflow,
  ListTodo,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Factory,
  Bell,
  History,
} from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useAutomationStats } from '@/modules/autonomous/hooks.js';

const TILES = [
  { href: '/ai/autonomous/automation-center', label: 'Automation Center', icon: Bot, desc: 'Running, pending, completed and failed automations' },
  { href: '/ai/autonomous/smart-workflows', label: 'Smart Workflows', icon: Workflow, desc: 'Configurable workflow builder and templates' },
  { href: '/ai/autonomous/ai-action-queue', label: 'AI Action Queue', icon: ListTodo, desc: 'Approval queue for AI-recommended actions' },
  { href: '/ai/autonomous/capa-automation', label: 'CAPA Automation', icon: ClipboardCheck, desc: 'Auto-draft CAPAs, assign owners, track completion' },
  { href: '/ai/autonomous/audit-automation', label: 'Audit Automation', icon: FileText, desc: 'Auto-generate audit plans, checklists, reports' },
  { href: '/ai/autonomous/policy-automation', label: 'Policy Automation', icon: FileText, desc: 'Policy updates, version comparison, distribution' },
  { href: '/ai/autonomous/training-automation', label: 'Training Automation', icon: GraduationCap, desc: 'Recommend training topics, schedules, assessments' },
  { href: '/ai/autonomous/supplier-automation', label: 'Supplier Automation', icon: Factory, desc: 'Supplier scorecards, audits, corrective actions' },
  { href: '/ai/autonomous/notification-automation', label: 'Notification Automation', icon: Bell, desc: 'Email, SMS, WhatsApp, escalation messages' },
  { href: '/ai/autonomous/ai-decision-history', label: 'AI Decision History', icon: History, desc: 'Full audit trail of AI decisions and rollbacks' },
];

export default function AutonomousCompliancePage() {
  const { data: stats } = useAutomationStats();

  const summary = useMemo(() => {
    const items = [
      { label: 'Total Actions', value: String(stats?.totalActions ?? 0) },
      { label: 'Pending Approval', value: String(stats?.pendingApproval ?? 0) },
      { label: 'Completed Jobs', value: String(stats?.completedJobs ?? 0) },
      { label: 'Failed Jobs', value: String(stats?.failedJobs ?? 0) },
    ];
    return items;
  }, [stats]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Autonomous Compliance</h1>
        <p className="text-sm text-[rgb(var(--muted))]">AI-powered automation with human-in-the-loop approval workflows.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className="mt-1 text-lg font-semibold">{s.value}</p>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Modules</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link key={tile.href} href={tile.href}>
                <Card className="flex h-full flex-col gap-2 p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                  <Icon className="h-5 w-5 text-[rgb(var(--primary))]" />
                  <div>
                    <p className="text-sm font-medium">{tile.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{tile.desc}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
