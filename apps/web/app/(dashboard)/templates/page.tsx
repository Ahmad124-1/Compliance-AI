'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';

import { Button, Card, Field, Input, Skeleton, ErrorState, EmptyState, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useTemplates, useTemplateStats, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/modules/templates/store.js';
import { TEMPLATE_CHANNEL_LABELS } from '@/modules/templates/constants.js';
import type { MessageTemplate, MessageTemplateCreateInput } from '@/modules/templates/types.js';

export default function TemplatesPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission('template:write');
  const canDelete = hasPermission('template:delete');
  const { data: templates, isLoading, error, refetch } = useTemplates();
  const { data: stats } = useTemplateStats();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [channel, setChannel] = useState<MessageTemplate['channel']>('email');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [language, setLanguage] = useState('en');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setSlug('');
    setChannel('email');
    setCategory('');
    setSubject('');
    setBody('');
    setLanguage('en');
    setIsActive(true);
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setOpenForm(true); };

  const openEdit = (tmpl: MessageTemplate) => {
    setEditing(tmpl);
    setName(tmpl.name);
    setSlug(tmpl.slug);
    setChannel(tmpl.channel);
    setCategory(tmpl.category);
    setSubject(tmpl.subject ?? '');
    setBody(tmpl.body);
    setLanguage(tmpl.language);
    setIsActive(tmpl.isActive);
    setOpenForm(true);
  };

  const submit = async () => {
    if (!name.trim() || !slug.trim() || !body.trim()) return;
    const dto: MessageTemplateCreateInput = { name, slug, channel, category, subject: subject || null, body, language, isActive };
    try {
      if (editing) { await updateTemplate.mutateAsync({ id: editing.id, patch: dto }); toast({ title: 'Template updated', variant: 'success' }); }
      else { await createTemplate.mutateAsync(dto); toast({ title: 'Template created', variant: 'success' }); }
      setOpenForm(false);
      resetForm();
    } catch (e) { toast({ title: 'Action failed', description: String(e), variant: 'error' }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteTemplate.mutateAsync(id); toast({ title: 'Template deleted', variant: 'success' }); }
    catch (e) { toast({ title: 'Delete failed', description: String(e), variant: 'error' }); }
  };

  if (error) return <ErrorState title="Failed to load templates" message={String(error)} onRetry={() => refetch()} />;

  const categories = Array.from(new Set((templates?.templates ?? []).map((t) => t.category)));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Message Templates</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Create and manage message templates across channels.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> New Template</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Templates" value={stats?.total ?? 0} />
        <StatTile label="Categories" value={categories.length} />
        <StatTile label="Active" value={(templates?.templates ?? []).filter((t) => t.isActive).length} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Templates by Channel</h2>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATE_CHANNEL_LABELS).map(([key, label]) => {
              const count = (templates?.templates ?? []).filter((t) => t.channel === key).length;
              return (
                <span key={key} className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] px-3 py-1.5 text-xs">
                  <span className="font-medium">{label}</span>
                  <span className="ml-1 text-[rgb(var(--muted))]">({count})</span>
                </span>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Templates</h2>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (templates?.templates?.length ?? 0) === 0 ? (
          <EmptyState title="No templates" description="Create your first template to get started." action={canEdit && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Create Template</Button>} />
        ) : (
          <div className="space-y-2">
             {(templates?.templates ?? []).map((tmpl) => (
              <div key={tmpl.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{tmpl.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tmpl.isActive ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>{tmpl.isActive ? 'Active' : 'Inactive'}</span>
                    <span className="rounded-full bg-[rgb(var(--primary)/0.15)] px-2 py-0.5 text-xs text-[rgb(var(--primary))]">{TEMPLATE_CHANNEL_LABELS[tmpl.channel] ?? tmpl.channel}</span>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted))] truncate">{tmpl.subject ?? tmpl.body}</p>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">Category: {tmpl.category} · Version: {tmpl.version} · {tmpl.language}</div>
                </div>
                <div className="flex gap-1 ml-2">
                  {canEdit && <Button size="sm" variant="ghost" onClick={() => openEdit(tmpl)}><Pencil className="h-4 w-4" /></Button>}
                  {canDelete && <Button size="sm" variant="ghost" onClick={() => handleDelete(tmpl.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={openForm} onClose={() => { setOpenForm(false); resetForm(); }} title={editing ? 'Edit Template' : 'Create Template'} description={editing ? 'Update message template configuration.' : 'Configure a new message template.'} size="lg" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setOpenForm(false); resetForm(); }}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={createTemplate.isPending || updateTemplate.isPending}>{editing ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" /></Field>
            <Field label="Slug"><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="template-slug" /></Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Channel">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={channel} onChange={(e) => setChannel(e.target.value as MessageTemplate['channel'])}>
                {Object.entries(TEMPLATE_CHANNEL_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </Field>
            <Field label="Category"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. alerts" /></Field>
          </div>
          <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (for email)" /></Field>
          <Field label="Body"><textarea className="h-32 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Template body content..." /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Language"><Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" /></Field>
            <Field label="Status">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </Field>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--text))]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </Card>
  );
}
