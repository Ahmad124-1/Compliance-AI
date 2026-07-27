'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { HAZARD_CLASSIFICATIONS, RISK_RATINGS, APPROVAL_STATUSES } from '@/modules/environment/constants.js';

export default function ChemicalsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ chemicalName: '', hazardClassification: 'toxic', quantity: '', unit: 'kg', storageLocation: '', riskRating: 'medium', approvalStatus: 'pending', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','chemicals'], queryFn: () => environmentService.listChemicals() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createChemical(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','chemicals'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate({ ...form, quantity: Number(form.quantity) }); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chemical Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage chemical inventory, MSDS, storage, and hazard classifications.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Chemical</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input type="text" placeholder="Chemical Name" value={form.chemicalName} onChange={(e) => setForm({ ...form, chemicalName: e.target.value })} required />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.hazardClassification} onChange={(e) => setForm({ ...form, hazardClassification: e.target.value })}>
              {HAZARD_CLASSIFICATIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input type="text" placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <Input type="text" placeholder="Storage Location" value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.riskRating} onChange={(e) => setForm({ ...form, riskRating: e.target.value })}>
              {RISK_RATINGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.approvalStatus} onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}>
              {APPROVAL_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Name</th><th className="p-2 text-left">Hazard</th><th className="p-2 text-left">Quantity</th><th className="p-2 text-left">Storage</th><th className="p-2 text-left">Risk</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {data?.map((c) => (
                  <tr key={c.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2">{c.chemicalName}</td>
                    <td className="p-2 capitalize">{c.hazardClassification.replace('_', ' ')}</td>
                    <td className="p-2">{c.quantity} {c.unit}</td>
                    <td className="p-2">{c.storageLocation ?? '-'}</td>
                    <td className="p-2 capitalize">{c.riskRating ?? '-'}</td>
                    <td className="p-2 capitalize">{c.approvalStatus.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No chemicals found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
