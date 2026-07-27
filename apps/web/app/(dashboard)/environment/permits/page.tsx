'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { PERMIT_TYPES, PERMIT_STATUSES } from '@/modules/environment/constants.js';

export default function PermitsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ permitType: 'water', permitNumber: '', issuingAuthority: '', issueDate: '', expiryDate: '', status: 'active', notes: '' });

  const { data, isLoading } = useQuery({ queryKey: ['environment','permits'], queryFn: () => environmentService.listPermits() });
  const createMutation = useMutation({ mutationFn: (input: Record<string, unknown>) => environmentService.createPermit(input), onSuccess: () => { qc.invalidateQueries({ queryKey: ['environment','permits'] }); qc.invalidateQueries({ queryKey: ['environment','dashboard'] }); setShowForm(false); } });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); createMutation.mutate(form); };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Permits</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track water, air, waste, and chemical permits with expiry alerts.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 mr-1" /> Add Permit</Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value })}>
              {PERMIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Input type="text" placeholder="Permit Number" value={form.permitNumber} onChange={(e) => setForm({ ...form, permitNumber: e.target.value })} required />
            <Input type="text" placeholder="Issuing Authority" value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} required />
            <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
            <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
            <select className="rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {PERMIT_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
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
              <thead><tr className="border-b border-[rgb(var(--border-color))]"><th className="p-2 text-left">Type</th><th className="p-2 text-left">Number</th><th className="p-2 text-left">Authority</th><th className="p-2 text-left">Issue Date</th><th className="p-2 text-left">Expiry Date</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {data?.map((p) => (
                  <tr key={p.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2 capitalize">{p.permitType.replace('_', ' ')}</td>
                    <td className="p-2">{p.permitNumber}</td>
                    <td className="p-2">{p.issuingAuthority}</td>
                    <td className="p-2">{p.issueDate}</td>
                    <td className="p-2">{p.expiryDate}</td>
                    <td className="p-2 capitalize">{p.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!data || data.length === 0) && <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No permits found.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
