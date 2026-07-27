'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { AIR_EMISSION_TYPES, MONITORING_FREQUENCIES } from '@/modules/environment/constants.js';

export default function AirEmissionsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ emissionType: 'stack', emissionDate: '', quantity: '', unit: 'kg', monitoringFrequency: 'monthly', reportingPeriod: '', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','air'], queryFn: () => environmentService.listAir() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createAir(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','air'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Air Emission Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track stack, boiler, generator, and pollutant emissions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.emissionType} onChange={(e) => setForm({ ...form, emissionType: e.target.value })}>
              {AIR_EMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="date" value={form.emissionDate} onChange={(e) => setForm({ ...form, emissionDate: e.target.value })} required />
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input type="text" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.monitoringFrequency} onChange={(e) => setForm({ ...form, monitoringFrequency: e.target.value })}>
              {MONITORING_FREQUENCIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="text" placeholder="Reporting Period" value={form.reportingPeriod} onChange={(e) => setForm({ ...form, reportingPeriod: e.target.value })} required />
            <Input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" />
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Quantity</th><th className="p-2 text-left">Frequency</th><th className="p-2 text-left">Period</th></tr></thead>
              <tbody>
                {data?.map((a) => (
                  <tr key={a.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{a.emissionDate}</td>
                    <td className="p-2 capitalize">{a.emissionType.replace('_', ' ')}</td>
                    <td className="p-2">{a.quantity} {a.unit}</td>
                    <td className="p-2 capitalize">{a.monitoringFrequency?.replace('_', ' ') ?? '-'}</td>
                    <td className="p-2">{a.reportingPeriod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No air emission records found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
