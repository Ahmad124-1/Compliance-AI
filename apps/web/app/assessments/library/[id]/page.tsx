'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Layers, FileText, Network } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { EmptyState } from '@/components/ui/states.js';
import { useLibraryItem, useFrameworkMappings, useControlMappings } from '@/modules/assessments/module.store.js';
import { FRAMEWORK_LABELS, ANSWER_TYPE_LABELS, type AssessmentSection, type AssessmentQuestion, type TemplateStructure } from '@/modules/assessments/module.types.js';

export default function LibraryItemPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: structure, isLoading } = useLibraryItem(id);
  const { data: fwMappings } = useFrameworkMappings(id);
  const { data: ctlMappings } = useControlMappings(id);

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;
  if (!structure) return <EmptyState title="Library item not found" description="This item may have been removed." />;

  const template = (structure as TemplateStructure).template;
  const sections = ((structure as TemplateStructure).sections ?? []) as AssessmentSection[];
  const questions = ((structure as TemplateStructure).questions ?? []) as AssessmentQuestion[];
  const totalQuestions = questions.length;
  const totalSections = sections.length;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/assessments"><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-semibold">{template.title}</h1>
          <p className="text-xs text-[rgb(var(--muted))]">{template.code ?? 'No code'} · v{template.version}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Questions" value={totalQuestions} icon={FileText} />
        <StatCard label="Sections" value={totalSections} icon={Layers} />
        <StatCard label="Frameworks" value={fwMappings?.length ?? 0} icon={Network} />
        <StatCard label="Status" value={template.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Framework Mappings</h2>
          {fwMappings?.length ? (
            <div className="space-y-2">
              {fwMappings.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-2">
                  <div>
                    <p className="text-sm font-medium">{FRAMEWORK_LABELS[m.framework as keyof typeof FRAMEWORK_LABELS] ?? m.framework}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{m.clauseCode ?? '—'} · {m.mappingStrength}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[rgb(var(--muted))]">No framework mappings.</p>}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Control Mappings</h2>
          {ctlMappings?.length ? (
            <div className="space-y-2">
              {ctlMappings.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-2">
                  <div>
                    <p className="text-sm font-medium">{m.controlTitle ?? m.controlCode ?? '—'}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{m.controlSource} · {m.mappingStrength}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[rgb(var(--muted))]">No control mappings.</p>}
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Checklist Structure</h2>
        <Card className="divide-y divide-[rgb(var(--border-color))]">
          {sections.map((s) => {
            const qs = questions.filter((q) => (q.sectionId ?? '') === s.id).sort((a, b) => a.position - b.position);
            return (
              <div key={s.id} className="p-4">
                <p className="text-sm font-semibold">{s.title}</p>
                {s.description && <p className="text-xs text-[rgb(var(--muted))]">{s.description}</p>}
                <div className="mt-2 space-y-1">
                  {qs.map((q) => (
                    <div key={q.id} className="flex items-center justify-between text-sm">
                      <span>{q.label}</span>
                      <span className="text-xs text-[rgb(var(--muted))]">{ANSWER_TYPE_LABELS[q.answerTypeKey]}</span>
                    </div>
                  ))}
                  {qs.length === 0 && <p className="text-xs text-[rgb(var(--muted))]">No questions.</p>}
                </div>
              </div>
            );
          })}
          {sections.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No sections.</p>}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon?: any }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-[rgb(var(--muted))]" /> : null}
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
