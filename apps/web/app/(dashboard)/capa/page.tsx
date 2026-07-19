'use client';

import { useState } from 'react';
import { Plus, AlertTriangle, ShieldAlert, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Field } from '@/components/ui/Field.js';
import { useCAPAFindings, useCAPANonConformities, useCAPAs, useCreateCAPA } from '@/modules/capa/module.store.js';

export default function CAPAPage() {
  const { data: findings = [] as Array<{ id: string; title: string }> } = useCAPAFindings();
  const { data: nonConformities = [] as Array<{ id: string; title: string }> } = useCAPANonConformities();
  const { data: capas = [] as Array<{ id: string; title: string }> } = useCAPAs();
  const createCAPA = useCreateCAPA();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('high');
  const [severity, setSeverity] = useState('major');

  const onCreate = async () => {
    if (!title.trim()) return;
    await createCAPA.mutateAsync({ title, priority, severity });
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Findings & CAPA Workspace</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Centralize non-conformities, corrective action plans, and verification workflows.</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="CAPA title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Supplier packaging lapse" />
          </Field>
          <Field label="Priority">
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Severity">
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="minor">Minor</option>
              <option value="major">Major</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Button size="sm" onClick={onCreate} disabled={createCAPA.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Create CAPA
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p className="font-medium">Findings</p>
          </div>
          {findings.map((item: any) => <div key={item.id} className="mb-2 text-sm">{item.title}</div>)}
          {findings.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No findings yet.</p>}
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <p className="font-medium">Non-Conformities</p>
          </div>
          {nonConformities.map((item: any) => <div key={item.id} className="mb-2 text-sm">{item.title}</div>)}
          {nonConformities.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No non-conformities yet.</p>}
        </Card>
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <p className="font-medium">CAPAs</p>
          </div>
          {capas.map((item: any) => <div key={item.id} className="mb-2 text-sm">{item.title}</div>)}
          {capas.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No CAPAs yet.</p>}
        </Card>
      </div>
    </div>
  );
}
