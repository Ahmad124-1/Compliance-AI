'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { LIKELIHOOD_LEVELS, SEVERITY_LEVELS, RISK_STATUSES } from '@/modules/environment/constants.js';

export default function EnvironmentalRisksPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ aspect: '', impact: '', likelihood: 'possible', severity: 'moderate', riskScore: '', controls: '', mitigationMeasures: '', status: 'active', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','risks'], queryFn: () => environmentService.listRisks() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createRisk(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','risks'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, riskScore: Number(form.riskScore) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Risk Register</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Identify, assess, and manage environmental risks and impacts.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Risk</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="text" placeholder="Environmental Aspect" value={form.aspect} onChange={(e) => setForm({ ...form, aspect: e.target.value })} required className="md:col-span-2" />
            <Input type="text" placeholder="Impact" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} required className="md:col-span-2" />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: e.target.value })}>
              {LIKELIHOOD_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {SEVERITY_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="number" placeholder="Risk Score" value={form.riskScore} onChange={(e) => setForm({ ...form, riskScore: e.target.value })} required />
            <Input type="text" placeholder="Controls" value={form.controls} onChange={(e) => setForm({ ...form, controls: e.target.value })} />
            <Input type="text" placeholder="Mitigation Measures" value={form.mitigationMeasures} onChange={(e) => setForm({ ...form, mitigationMeasures: e.target.value })} className="md:col-span-3" />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {RISK_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Aspect</th><th className="p-2 text-left">Impact</th><th className="p-2 text-left">Likelihood</th><th className="p-2 text-left">Severity</th><th className="p-2 text-left">Score</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {data?.sort((a,b) => b.riskScore - a.riskScore).map((r) => (
                  <tr key={r.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{r.aspect}</td>
                    <td className="p-2">{r.impact}</td>
                    <td className="p-2 capitalize">{r.likelihood.replace('_', ' ')}</td>
                    <td className="p-2 capitalize">{r.severity.replace('_', ' ')}</td>
                    <td className="p-2 font-medium">{r.riskScore}</td>
                    <td className="p-2 capitalize">{r.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No risks found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
