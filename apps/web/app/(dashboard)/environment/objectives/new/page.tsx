'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { OBJECTIVE_TYPES, OBJECTIVE_STATUSES, OBJECTIVE_PRIORITIES } from '@/modules/environment/constants.js';

export default function NewObjectivePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    objectiveType: 'waste_reduction',
    description: '',
    targetValue: '',
    currentValue: '0',
    unit: '%',
    baseline: '0',
    deadline: '',
    priority: 'medium',
    status: 'in_progress',
    departmentId: '',
    facilityId: '',
    ownerId: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createObjective(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'objectives'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/objectives');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      targetValue: Number(form.targetValue),
      currentValue: Number(form.currentValue),
      baseline: Number(form.baseline),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">New Environmental Objective</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Set environmental goals aligned with ISO 14001.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Objective Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Objective Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.objectiveType} onChange={(e) => setForm({ ...form, objectiveType: e.target.value })}>
              {OBJECTIVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Target Value" value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} required />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input type="number" placeholder="Current Value" value={form.currentValue} onChange={(e) => setForm({ ...form, currentValue: e.target.value })} />
            <Input type="number" placeholder="Baseline" value={form.baseline} onChange={(e) => setForm({ ...form, baseline: e.target.value })} />
          </div>
          <Input type="date" placeholder="Deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {OBJECTIVE_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {OBJECTIVE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Create Objective</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
