'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ClipboardList, Library, FileText, Plus, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Field } from '@/components/ui/Field.js';
import { EmptyState } from '@/components/ui/states.js';
import { useAssessmentDashboard, useTemplates, useLibrary, useCreateTemplate, useAssessmentTypes } from '@/modules/assessments/module.store.js';
import { templateSchema, type TemplateInput } from '@/modules/assessments/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { ASSESSMENT_TYPE_LABELS } from '@/modules/assessments/module.types.js';
import { STATUS_LABELS } from '@/modules/assessments/module.constants.js';

export default function AssessmentsDashboardPage() {
  const { data: dash } = useAssessmentDashboard();
  const { data: templates } = useTemplates({ pageSize: 6 });
  const { data: library } = useLibrary({ pageSize: 6 });
  const create = useCreateTemplate();
  const types = useAssessmentTypes();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('internal');
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    const parsed = templateSchema.safeParse({ title, type });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Invalid'); return; }
    await create.mutateAsync({ title, type } as TemplateInput);
    setTitle(''); setOpen(false);
  };

  const stats = [
    { label: 'Total Templates', value: dash?.totalTemplates ?? 0, icon: FileText, href: ASSESSMENT_ROUTES_TEMPLATES },
    { label: 'Published', value: dash?.publishedTemplates ?? 0, icon: Layers, href: ASSESSMENT_ROUTES_TEMPLATES },
    { label: 'Assessments', value: dash?.totalAssessments ?? 0, icon: ClipboardList, href: ASSESSMENT_ROUTES_DASHBOARD },
    { label: 'Active', value: dash?.activeAssessments ?? 0, icon: Library, href: ASSESSMENT_ROUTES_DASHBOARD },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessment Framework Engine</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Build dynamic checklists, map to frameworks, and score compliance.</p>
        </div>
        {hasPermission('assessment:create') && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus className="h-4 w-4" /> New Template
          </Button>
        )}
      </div>

      {open && hasPermission('assessment:create') && (
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title" error={error ?? undefined}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Factory Audit 2026" />
            </Field>
            <Field label="Type">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
                {(types.data?.map((t) => t.type) ?? ['internal', 'supplier', 'factory', 'self', 'customer', 'pre_audit', 'follow_up', 'custom']).map((t) => (
                  <option key={t} value={t}>{ASSESSMENT_TYPE_LABELS[t as keyof typeof ASSESSMENT_TYPE_LABELS]}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={onCreate} disabled={create.isPending}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 hover:bg-[rgb(var(--panel-2))]">
              <s.icon className="mb-2 h-5 w-5 text-[rgb(var(--primary))]" />
              <p className="text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Recent Templates</h2>
          <Card className="divide-y divide-[rgb(var(--border-color))]">
            {templates?.data.length ? templates.data.map((t) => (
              <Link key={t.id} href={`/assessments/templates/${t.id}`} className="block p-3 hover:bg-[rgb(var(--panel-2))]">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{ASSESSMENT_TYPE_LABELS[t.type]} · v{t.version} · {STATUS_LABELS[t.status]}</p>
              </Link>
            )) : <EmptyState title="No templates yet" />}
          </Card>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Template Library</h2>
          <Card className="divide-y divide-[rgb(var(--border-color))]">
            {library?.data.length ? library.data.map((t) => (
              <Link key={t.id} href={`/assessments/library/${t.id}`} className="block p-3 hover:bg-[rgb(var(--panel-2))]">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{t.questionCount} questions · {t.sectionCount} sections · {t.frameworkCount} frameworks</p>
              </Link>
            )) : <EmptyState title="Library is empty" />}
          </Card>
        </section>
      </div>
    </div>
  );
}

const ASSESSMENT_ROUTES_TEMPLATES = '/assessments/templates';
const ASSESSMENT_ROUTES_DASHBOARD = '/assessments';
