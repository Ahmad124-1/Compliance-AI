'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { WATER_SOURCE_TYPES } from '@/modules/environment/constants.js';

export default function WaterUsagePage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sourceType: 'municipal', consumptionDate: '', consumptionAmount: '', unit: 'm3', dischargeAmount: '', treatmentMethod: '', reuseAmount: '0', leakDetected: false, notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','water'], queryFn: () => environmentService.listWater() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createWater(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','water'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); setForm({ sourceType: 'municipal', consumptionDate: '', consumptionAmount: '', unit: 'm3', dischargeAmount: '', treatmentMethod: '', reuseAmount: '0', leakDetected: false, notes: '' }); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, consumptionAmount: Number(form.consumptionAmount), dischargeAmount: form.dischargeAmount ? Number(form.dischargeAmount) : undefined, reuseAmount: Number(form.reuseAmount) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Water Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track water sources, consumption, discharge, and treatment.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
              {WATER_SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="date" value={form.consumptionDate} onChange={(e) => setForm({ ...form, consumptionDate: e.target.value })} required />
            <Input type="number" placeholder="Consumption Amount" value={form.consumptionAmount} onChange={(e) => setForm({ ...form, consumptionAmount: e.target.value })} required />
            <Input type="text" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input type="number" placeholder="Discharge Amount" value={form.dischargeAmount} onChange={(e) => setForm({ ...form, dischargeAmount: e.target.value })} />
            <Input type="text" placeholder="Treatment Method" value={form.treatmentMethod} onChange={(e) => setForm({ ...form, treatmentMethod: e.target.value })} />
            <Input type="number" placeholder="Reuse Amount" value={form.reuseAmount} onChange={(e) => setForm({ ...form, reuseAmount: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.leakDetected} onChange={(e) => setForm({ ...form, leakDetected: e.target.checked })} /> Leak Detected
            </label>
            <Input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-4" />
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Source</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Discharge</th><th className="p-2 text-left">Treatment</th><th className="p-2 text-left">Leak</th></tr></thead>
              <tbody>
                {data?.map((w) => (
                  <tr key={w.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{w.consumptionDate}</td>
                    <td className="p-2 capitalize">{w.sourceType.replace('_', ' ')}</td>
                    <td className="p-2">{w.consumptionAmount} {w.unit}</td>
                    <td className="p-2">{w.dischargeAmount ?? '-'}</td>
                    <td className="p-2">{w.treatmentMethod ?? '-'}</td>
                    <td className="p-2">{w.leakDetected ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No water usage records found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
