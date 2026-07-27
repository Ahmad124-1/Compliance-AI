'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil, Pause, Play } from 'lucide-react';

import { Button, Card, Field, Input, Skeleton, ErrorState, EmptyState, Dialog } from '@/components/ui';
import { useToast } from '@/providers/ToastProvider.js';
import { useAuth } from '@/providers/AuthProvider.js';
import { useSlaDefinitions, useSlaInstances, useCreateSlaDefinition, useUpdateSlaDefinition, useDeleteSlaDefinition, usePauseSlaInstance, useResumeSlaInstance } from '@/modules/sla/store.js';
import { SLA_TYPE_LABELS, SLA_STATUS_LABELS } from '@/modules/sla/constants.js';
import type { SlaDefinition } from '@/modules/sla/types.js';

export default function SLAPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission('sla:write');
  const canDelete = hasPermission('sla:delete');
  const { data: defs, isLoading: defsLoading, error: defsError, refetch: refetchDefs } = useSlaDefinitions();
  const { data: instances, isLoading: instLoading } = useSlaInstances();
  const createDef = useCreateSlaDefinition();
  const updateDef = useUpdateSlaDefinition();
  const deleteDef = useDeleteSlaDefinition();
  const pauseInst = usePauseSlaInstance();
  const resumeInst = useResumeSlaInstance();

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<SlaDefinition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SlaDefinition['type']>('resolution');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [warningMinutes, setWarningMinutes] = useState(30);
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setType('resolution');
    setTargetMinutes(60);
    setWarningMinutes(30);
    setIsActive(true);
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setOpenForm(true); };

  const openEdit = (def: SlaDefinition) => {
    setEditing(def);
    setName(def.name);
    setDescription(def.description ?? '');
    setType(def.type);
    setTargetMinutes(def.targetMinutes);
    setWarningMinutes(def.warningMinutes);
    setIsActive(def.isActive);
    setOpenForm(true);
  };

  const submit = async () => {
    if (!name.trim()) return;
    const dto: Partial<SlaDefinition> = { name, description: description || null, type, targetMinutes, warningMinutes, isActive };
    try {
      if (editing) { await updateDef.mutateAsync({ id: editing.id, patch: dto }); toast({ title: 'Definition updated', variant: 'success' }); }
      else { await createDef.mutateAsync(dto); toast({ title: 'Definition created', variant: 'success' }); }
      setOpenForm(false);
      resetForm();
    } catch (e) { toast({ title: 'Action failed', description: String(e), variant: 'error' }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteDef.mutateAsync(id); toast({ title: 'Definition deleted', variant: 'success' }); }
    catch (e) { toast({ title: 'Delete failed', description: String(e), variant: 'error' }); }
  };

  const handlePause = async (id: string) => {
    try { await pauseInst.mutateAsync({ id, reason: 'Paused by user' }); toast({ title: 'Instance paused', variant: 'success' }); }
    catch (e) { toast({ title: 'Action failed', description: String(e), variant: 'error' }); }
  };

  const handleResume = async (id: string) => {
    try { await resumeInst.mutateAsync(id); toast({ title: 'Instance resumed', variant: 'success' }); }
    catch (e) { toast({ title: 'Action failed', description: String(e), variant: 'error' }); }
  };

  if (defsError) return <ErrorState title="Failed to load" message={String(defsError)} onRetry={() => refetchDefs()} />;

  const allInstances = instances?.instances ?? [];
  const breached = allInstances.filter((i) => i.status === 'breached').length;
  const atRisk = allInstances.filter((i) => i.status === 'at_risk').length;
  const met = allInstances.filter((i) => i.status === 'met').length;
  const complianceRate = allInstances.length > 0 ? Math.round((met / allInstances.length) * 100) : 0;

  function statusColor(status: string) {
    switch (status) {
      case 'on_track': return 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]';
      case 'at_risk': return 'bg-[rgb(var(--warning)/0.15)] text-[rgb(var(--warning))]';
      case 'breached': return 'bg-[rgb(var(--danger)/0.15)] text-[rgb(var(--danger))]';
      case 'paused': return 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]';
      case 'met': return 'bg-[rgb(var(--primary)/0.15)] text-[rgb(var(--primary))]';
      default: return 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]';
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SLA Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Define SLAs, monitor instances, and track compliance.</p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> New SLA</Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Compliance Rate" value={`${complianceRate}%`} />
        <StatTile label="Breached" value={breached} />
        <StatTile label="At Risk" value={atRisk} />
        <StatTile label="Definitions" value={defs?.total ?? 0} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">SLA Instances</h2>
        {instLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : allInstances.length === 0 ? (
          <EmptyState title="No SLA instances" description="Create an SLA definition to start tracking instances." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-color))] text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                  <th className="px-3 py-2 font-medium">Entity</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                  <th className="px-3 py-2 font-medium">Remaining</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                {allInstances.slice(0, 50).map((inst) => (
                  <tr key={inst.id} className="hover:bg-[rgb(var(--panel-2))]">
                    <td className="px-3 py-2">{inst.entityType} <span className="text-[rgb(var(--muted))]">{inst.entityId}</span></td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(inst.status)}`}>{SLA_STATUS_LABELS[inst.status] ?? inst.status}</span></td>
                    <td className="px-3 py-2">{new Date(inst.targetAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{inst.remainingMinutes !== null ? `${inst.remainingMinutes}m` : '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {inst.status === 'on_track' && <Button size="sm" variant="ghost" onClick={() => handlePause(inst.id)}><Pause className="h-4 w-4" /></Button>}
                        {inst.status === 'paused' && <Button size="sm" variant="ghost" onClick={() => handleResume(inst.id)}><Play className="h-4 w-4" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">SLA Definitions</h2>
        {defsLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (defs?.definitions?.length ?? 0) === 0 ? (
          <EmptyState title="No SLA definitions" description="Create your first SLA to get started." action={canEdit && <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4" /> Create SLA</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-color))] text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Target</th>
                  <th className="px-3 py-2 font-medium">Warning</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border-color))]">
                 {(defs?.definitions ?? []).map((def) => (
                  <tr key={def.id} className="hover:bg-[rgb(var(--panel-2))]">
                    <td className="px-3 py-2 font-medium">{def.name}</td>
                    <td className="px-3 py-2">{SLA_TYPE_LABELS[def.type] ?? def.type}</td>
                    <td className="px-3 py-2">{def.targetMinutes}m</td>
                    <td className="px-3 py-2">{def.warningMinutes}m</td>
                    <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${def.isActive ? 'bg-[rgb(var(--success)/0.15)] text-[rgb(var(--success))]' : 'bg-[rgb(var(--panel-2))] text-[rgb(var(--muted))]'}`}>{def.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {canEdit && <Button size="sm" variant="ghost" onClick={() => openEdit(def)}><Pencil className="h-4 w-4" /></Button>}
                        {canDelete && <Button size="sm" variant="ghost" onClick={() => handleDelete(def.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={openForm} onClose={() => { setOpenForm(false); resetForm(); }} title={editing ? 'Edit SLA Definition' : 'Create SLA Definition'} description={editing ? 'Update SLA configuration.' : 'Configure a new SLA definition.'} size="md" footer={
        <>
          <Button variant="outline" size="sm" onClick={() => { setOpenForm(false); resetForm(); }}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={createDef.isPending || updateDef.isPending}>{editing ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="SLA name" /></Field>
          <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Type">
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={type} onChange={(e) => setType(e.target.value as SlaDefinition['type'])}>
                {Object.entries(SLA_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </Field>
            <Field label="Status">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Target Minutes"><Input type="number" value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} /></Field>
            <Field label="Warning Minutes"><Input type="number" value={warningMinutes} onChange={(e) => setWarningMinutes(Number(e.target.value))} /></Field>
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
