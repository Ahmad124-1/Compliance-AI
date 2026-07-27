'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { WASTE_TYPES } from '@/modules/environment/constants.js';

export default function WasteRecordsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ wasteType: 'general', wasteDate: '', quantity: '', unit: 'kg', disposalMethod: '', manifestNumber: '', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','waste'], queryFn: () => environmentService.listWaste() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createWaste(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','waste'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Waste Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track waste generation, disposal, recycling, and hazardous waste.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.wasteType} onChange={(e) => setForm({ ...form, wasteType: e.target.value })}>
              {WASTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="date" value={form.wasteDate} onChange={(e) => setForm({ ...form, wasteDate: e.target.value })} required />
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input type="text" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input type="text" placeholder="Disposal Method" value={form.disposalMethod} onChange={(e) => setForm({ ...form, disposalMethod: e.target.value })} required />
            <Input type="text" placeholder="Manifest Number" value={form.manifestNumber} onChange={(e) => setForm({ ...form, manifestNumber: e.target.value })} className="md:col-span-3" />
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Date</th><th className="p-2 text-left">Type</th><th className="p-2 text-left">Quantity</th><th className="p-2 text-left">Disposal</th><th className="p-2 text-left">Manifest</th></tr></thead>
              <tbody>
                {data?.map((w) => (
                  <tr key={w.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{w.wasteDate}</td>
                    <td className="p-2 capitalize">{w.wasteType.replace('_', ' ')}</td>
                    <td className="p-2">{w.quantity} {w.unit}</td>
                    <td className="p-2">{w.disposalMethod}</td>
                    <td className="p-2">{w.manifestNumber ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No waste records found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
