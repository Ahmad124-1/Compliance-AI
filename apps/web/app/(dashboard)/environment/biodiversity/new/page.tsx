'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { BIODIVERSITY_RECORD_TYPES, BIODIVERSITY_STATUSES } from '@/modules/environment/constants.js';

export default function NewBiodiversityPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    recordType: 'tree_plantation',
    location: '',
    areaCovered: '',
    treesPlanted: '',
    speciesCount: '',
    status: 'active',
    recordDate: '',
    description: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createBiodiversity(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'biodiversity'] });
      qc.invalidateQueries({ queryKey: ['environment', 'biodiversity', 'kpis'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/biodiversity');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      areaCovered: form.areaCovered ? Number(form.areaCovered) : undefined,
      treesPlanted: form.treesPlanted ? Number(form.treesPlanted) : undefined,
      speciesCount: form.speciesCount ? Number(form.speciesCount) : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">New Biodiversity Record</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Record biodiversity data for your organization.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Record Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value })} required>
              {BIODIVERSITY_RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input type="number" placeholder="Area Covered (ha)" value={form.areaCovered} onChange={(e) => setForm({ ...form, areaCovered: e.target.value })} />
          <Input type="number" placeholder="Trees Planted" value={form.treesPlanted} onChange={(e) => setForm({ ...form, treesPlanted: e.target.value })} />
          <Input type="number" placeholder="Species Count" value={form.speciesCount} onChange={(e) => setForm({ ...form, speciesCount: e.target.value })} />
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {BIODIVERSITY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <Input type="date" placeholder="Record Date" value={form.recordDate} onChange={(e) => setForm({ ...form, recordDate: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Save Record</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
