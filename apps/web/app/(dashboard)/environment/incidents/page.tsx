'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '@/modules/environment/constants.js';

export default function IncidentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ incidentType: 'chemical_spill', title: '', severity: 'medium', status: 'open', location: '', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','incidents'], queryFn: () => environmentService.listIncidents() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createIncident(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','incidents'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Incidents</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Record and track chemical spills, leaks, pollution events, and violations.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Report Incident</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.incidentType} onChange={(e) => setForm({ ...form, incidentType: e.target.value })}>
              {INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {INCIDENT_SEVERITIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {INCIDENT_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-3" />
            <div className="md:col-span-4 flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>Save</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4">
        {isLoading ? <div className="animate-pulse space-y-2"><div className="h-4 w-full rounded bg-[rgb(var(--muted))]" /><div className="h-4 w-full rounded bg-[rgb(var(--muted))]" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Title</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Severity</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Location</th></tr></thead>
              <tbody>
                {data?.map((inc) => (
                  <tr key={inc.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{inc.title}</td>
                    <td className="p-2 capitalize">{inc.incidentType.replace('_', ' ')}</td>
                    <td className="p-2 capitalize">{inc.severity}</td>
                    <td className="p-2 capitalize">{inc.status.replace('_', ' ')}</td>
                    <td className="p-2">{inc.location ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No incidents found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
