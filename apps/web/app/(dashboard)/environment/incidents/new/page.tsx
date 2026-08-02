'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '@/modules/environment/constants.js';

export default function NewIncidentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    incidentType: 'chemical_spill',
    severity: 'medium',
    status: 'open',
    incidentDate: '',
    location: '',
    description: '',
    immediateActions: '',
    rootCause: '',
    correctiveActions: '',
    reportedBy: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createIncident(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'incidents'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/incidents');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Report Environmental Incident</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Log spills, releases, violations, or environmental complaints.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Incident Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })} required>
              {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Severity</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {INCIDENT_SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {INCIDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" placeholder="Incident Date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} required />
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Textarea placeholder="Immediate Actions Taken" value={form.immediateActions} onChange={(e) => setForm({ ...form, immediateActions: e.target.value })} />
          <Textarea placeholder="Root Cause" value={form.rootCause} onChange={(e) => setForm({ ...form, rootCause: e.target.value })} />
          <Textarea placeholder="Corrective Actions" value={form.correctiveActions} onChange={(e) => setForm({ ...form, correctiveActions: e.target.value })} />
          <Input placeholder="Reported By" value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Report Incident</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
