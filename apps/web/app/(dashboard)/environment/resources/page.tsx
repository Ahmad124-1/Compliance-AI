'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { RESOURCE_TYPES } from '@/modules/environment/constants.js';

export default function ResourceUsagePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ resourceType: 'electricity', consumptionDate: '', consumptionAmount: '', unit: 'kWh', reportingPeriod: '', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','resources'], queryFn: () => environmentService.listResources() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createResource(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','resources'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, consumptionAmount: Number(form.consumptionAmount) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resource Efficiency</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track electricity, gas, fuel, steam, and compressed air usage.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.resourceType} onChange={(e) => setForm({ ...form, resourceType: e.target.value })}>
              {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="date" value={form.consumptionDate} onChange={(e) => setForm({ ...form, consumptionDate: e.target.value })} required />
            <Input type="number" placeholder="Amount" value={form.consumptionAmount} onChange={(e) => setForm({ ...form, consumptionAmount: e.target.value })} required />
            <Input type="text" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input type="text" placeholder="Reporting Period" value={form.reportingPeriod} onChange={(e) => setForm({ ...form, reportingPeriod: e.target.value })} required />
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Type</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Unit</th><th className="p-2 text-left">Period</th></tr></thead>
              <tbody>
                {data?.map((r) => (
                  <tr key={r.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2 capitalize">{r.resourceType.replace('_', ' ')}</td>
                    <td className="p-2">{r.consumptionDate}</td>
                    <td className="p-2">{r.consumptionAmount}</td>
                    <td className="p-2">{r.unit}</td>
                    <td className="p-2">{r.reportingPeriod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No resource usage records found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
