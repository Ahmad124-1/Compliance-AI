'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search, Archive, Copy, History, FilePlus2 } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Field } from '@/components/ui/Field.js';
import { EmptyState } from '@/components/ui/states.js';
import { Dialog } from '@/components/ui/Dialog.js';
import { useTemplates, useCreateTemplate, useArchiveTemplate, useDuplicateTemplate, usePublishTemplate, useUnpublishTemplate } from '@/modules/assessments/module.store.js';
import { templateSchema, type TemplateInput } from '@/modules/assessments/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { ASSESSMENT_TYPE_LABELS, type AssessmentTypeKey } from '@/modules/assessments/module.types.js';
import { STATUS_LABELS } from '@/modules/assessments/module.constants.js';

export default function TemplatesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tType, setTType] = useState<string>('internal');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useTemplates({ search, type: type || undefined, pageSize: 50 });
  const create = useCreateTemplate();
  const archive = useArchiveTemplate();
  const duplicate = useDuplicateTemplate();
  const publish = usePublishTemplate();
  const unpublish = useUnpublishTemplate();
  const { hasPermission } = useAuth();

  const onCreate = async () => {
    const parsed = templateSchema.safeParse({ title, type: tType });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Invalid'); return; }
    await create.mutateAsync({ title, type: tType } as TemplateInput);
    setTitle(''); setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Assessment Templates</h1>
        {hasPermission('assessment:create') && <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New Template</Button>}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[rgb(var(--muted))]" />
          <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" />
        </div>
        <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {data?.data.length ? data.data.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-3 hover:bg-[rgb(var(--panel-2))]">
            <Link href={`/assessments/templates/${t.id}`} className="flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{ASSESSMENT_TYPE_LABELS[t.type as AssessmentTypeKey]} · v{t.version} · {STATUS_LABELS[t.status]} {t.code ? `· ${t.code}` : ''}</p>
            </Link>
            <div className="flex items-center gap-1">
              {hasPermission('assessment:update') && (
                <>
                  {t.status === 'published'
                    ? <Button size="sm" variant="ghost" onClick={() => unpublish.mutate(t.id)}>Unpublish</Button>
                    : <Button size="sm" variant="ghost" onClick={() => publish.mutate({ id: t.id })}>Publish</Button>}
                  <Link href={`/assessments/templates/${t.id}`}><Button size="sm" variant="ghost" title="Builder"><FilePlus2 className="h-4 w-4" /></Button></Link>
                  <Button size="sm" variant="ghost" title="Duplicate" onClick={() => duplicate.mutate(t.id)}><Copy className="h-4 w-4" /></Button>
                   <Link href={`/assessments/templates/${t.id}/versions`}><Button size="sm" variant="ghost" title="Version History"><History className="h-4 w-4" /></Button></Link>
                  <Button size="sm" variant="ghost" title="Archive" onClick={() => archive.mutate(t.id)}><Archive className="h-4 w-4" /></Button>
                </>
              )}
            </div>
          </div>
        )) : <EmptyState title="No templates found" />}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} title="New Assessment Template">
        <Field label="Title" error={error ?? undefined}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Supplier Audit" />
        </Field>
        <Field label="Type" className="mt-3">
          <select className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={tType} onChange={(e) => setTType(e.target.value)}>
            {Object.entries(ASSESSMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onCreate} disabled={create.isPending}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Dialog>
    </div>
  );
}
