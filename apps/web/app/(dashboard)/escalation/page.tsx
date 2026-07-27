'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';

import { Button, Card, Field, Input, Skeleton, ErrorState, EmptyState, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useEscalationRules, useEscalationLevels, useCreateEscalationRule, useDeleteEscalationRule, useUpdateEscalationRule } from '@/modules/escalation/store.js';
import { CONDITION_TYPE_LABELS, CONDITION_OPERATOR_LABELS } from '@/modules/escalation/constants.js';
import type { EscalationRuleCreateInput, EscalationRuleV2 } from '@/modules/escalation/types.js';

type Condition = { type: EscalationRuleV2['conditions'][0]['type']; operator: EscalationRuleV2['conditions'][0]['operator']; value: string | number | string[] };

export default function EscalationPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission('escalation:write');
  const canDelete = hasPermission('escalation:delete');
  const { data: rules, isLoading, error, refetch } = useEscalationRules();
  const { data: levels = [] } = useEscalationLevels();
  const createRule = useCreateEscalationRule();
  const updateRule = useUpdateEscalationRule();
  const deleteRule = useDeleteEscalationRule();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<EscalationRuleV2 | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState('');
  const [logic, setLogic] = useState<'all' | 'any'>('all');
  const [isActive, setIsActive] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([{ type: 'priority' as Condition['type'], operator: 'equals' as Condition['operator'], value: '' }]);

  const safeConditions: Condition[] = conditions.map((c) => ({ type: c.type, operator: c.operator, value: c.value }));
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEntityType('');
    setLogic('all');
    setIsActive(true);
    setConditions([{ type: 'priority', operator: 'equals', value: '' }]);
    setSelectedLevels([]);
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setOpenForm(true); };

  const openEdit = (rule: EscalationRuleV2) => {
    setEditing(rule);
    setName(rule.name);
    setDescription(rule.description ?? '');
    setEntityType(rule.entityType);
    setLogic(rule.logic);
    setIsActive(rule.isActive);
    setConditions(
      rule.conditions.map((c) => ({ type: c.type, operator: c.operator, value: Array.isArray(c.value) ? c.value.join(',') : c.value }))
    );
    setSelectedLevels(rule.levels.map((l) => l.levelId));
    setOpenForm(true);
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, { type: 'priority', operator: 'equals', value: '' }]);
  };

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const toggleLevel = (id: string) => {
    setSelectedLevels((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!name.trim() || !entityType.trim()) return;
    const dto: EscalationRuleCreateInput = {
      name,
      description: description || null,
      entityType,
      isActive,
      logic,
      conditions: safeConditions.map((c) => ({
        type: c.type as Condition['type'],
        operator: c.operator as Condition['operator'],
        value: typeof c.value === 'string' && c.value.includes(',') ? c.value.split(',').map((v) => v.trim()) : c.value,
      })),
      levels: selectedLevels.map((id) => ({ levelId: id, delayMinutes: 0 })),
    };
    try {
      if (editing) {
        await updateRule.mutateAsync({ id: editing.id, patch: dto });
        toast({ title: 'Rule updated', variant: 'success' });
      } else {
        await createRule.mutateAsync(dto);
        toast({ title: 'Rule created', variant: 'success' });
      }
      setOpenForm(false);
      resetForm();
    } catch (e) {
      toast({ title: 'Action failed', description: String(e), variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id);
      toast({ title: 'Rule deleted', variant: 'success' });
    } catch (e) {
      toast({ title: 'Delete failed', description: String(e), variant: 'error' });
    }
  };

  if (error) return <ErrorState title="Failed to load" message={String(error)} onRetry={() => refetch()} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Escalation Rules</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage automatic escalation rules, conditions, and notification levels.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> New Rule</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile label="Total Rules" value={rules?.total ?? 0} />
        <StatTile label="Active Levels" value={levels.length} />
        <StatTile label="Rules" value={rules?.rules.filter((r) => r.isActive).length ?? 0} hint="active" />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Escalation Rules</h2>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (rules?.rules?.length ?? 0) === 0 ? (
          <EmptyState title="No escalation rules" description="Create your first rule to start automatic escalation." action={canEdit && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Create Rule</Button>} />
        ) : (
          <div className="space-y-3">
            {(rules?.rules ?? []).map((rule) => (
              <div key={rule.id} className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rule.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.isActive ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>{rule.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p className="text-xs text-[rgb(var(--muted))]">{rule.description ?? 'No description'} · Entity: {rule.entityType} · Logic: {rule.logic}</p>
                  </div>
                  <div className="flex gap-1">
                    {canEdit && <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => openEdit(rule)}><Pencil className="h-4 w-4" /></Button>}
                    {canDelete && <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => handleDelete(rule.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </div>
                </div>
                <div className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {rule.conditions.map((c, i) => (
                    <span key={i} className="mr-2 inline-flex items-center gap-1 rounded bg-[rgb(var(--panel-2))] px-2 py-0.5">
                      {CONDITION_TYPE_LABELS[c.type]} {CONDITION_OPERATOR_LABELS[c.operator]} {String(c.value)}
                    </span>
                  ))}
                </div>
                {rule.levels.length > 0 && (
                  <div className="mt-2 text-xs text-[rgb(var(--muted))]">Levels: {rule.levels.map((l) => levels.find((lv) => lv.id === l.levelId)?.name ?? l.levelId).join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Escalation Levels</h2>
        {levels.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No levels configured.</p>
        ) : (
          <div className="space-y-2">
            {levels.map((level) => (
              <div key={level.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{level.name}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Order: {level.order} · Delay: {level.delayMinutes}m · Target: {level.targetRole ?? level.targetUserId ?? 'N/A'}</p>
                </div>
                <span className="rounded-full bg-[rgb(var(--primary)/0.15)] px-2 py-0.5 text-xs text-[rgb(var(--primary))]">Level {level.order}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={openForm} onClose={() => { setOpenForm(false); resetForm(); }} title={editing ? 'Edit Rule' : 'Create Rule'} description={editing ? 'Update escalation rule configuration.' : 'Configure a new escalation rule.'} size="lg" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setOpenForm(false); resetForm(); }}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={createRule.isPending || updateRule.isPending}>{editing ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" /></Field>
            <Field label="Entity Type"><Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. cases" /></Field>
          </div>
          <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Logic">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={logic} onChange={(e) => setLogic(e.target.value as 'all' | 'any')}>
                <option value="all">All conditions</option>
                <option value="any">Any condition</option>
              </select>
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Conditions</p>
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-2 md:grid-cols-4">
                   <select className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-xs" value={cond.type} onChange={(e) => updateCondition(idx, { type: e.target.value as Condition['type'] })}>
                     {Object.entries(CONDITION_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                   </select>
                   <select className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-xs" value={cond.operator} onChange={(e) => updateCondition(idx, { operator: e.target.value as Condition['operator'] })}>
                    {Object.entries(CONDITION_OPERATOR_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                  <input className="h-9 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-xs" value={String(cond.value)} onChange={(e) => updateCondition(idx, { value: e.target.value })} placeholder="Value" />
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeCondition(idx)}>Remove</Button>
                </div>
              ))}
            </div>
            {canEdit && <Button size="sm" variant="outline" className="mt-2" onClick={addCondition}>Add Condition</Button>}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Escalation Levels</p>
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <label key={level.id} className="flex items-center gap-1.5 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] px-2 py-1 text-xs">
                  <input type="checkbox" checked={selectedLevels.includes(level.id)} onChange={() => toggleLevel(level.id)} />
                  {level.name}
                </label>
              ))}
            </div>
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
