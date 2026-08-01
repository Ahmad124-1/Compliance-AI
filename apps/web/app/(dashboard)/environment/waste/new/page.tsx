'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { WASTE_TYPES } from '@/modules/environment/constants.js';

export default function NewWastePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    wasteType: 'general',
    wasteDate: '',
    quantity: '',
    unit: 'kg',
    weight: '',
    disposalMethod: '',
    manifestNumber: '',
    hazardousDetails: '',
    cost: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createWaste(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'waste'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/waste');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
      weight: form.weight ? Number(form.weight) : null,
      cost: form.cost ? Number(form.cost) : null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Record Waste</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Record waste generation and disposal data.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Waste Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.wasteType} onChange={(e) => setForm({ ...form, wasteType: e.target.value })} required>
              {WASTE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input type="date" placeholder="Waste Date" value={form.wasteDate} onChange={(e) => setForm({ ...form, wasteDate: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Weight" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <Input placeholder="Disposal Method" value={form.disposalMethod} onChange={(e) => setForm({ ...form, disposalMethod: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Manifest Number" value={form.manifestNumber} onChange={(e) => setForm({ ...form, manifestNumber: e.target.value })} />
            <Input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <Input placeholder="Hazardous Details" value={form.hazardousDetails} onChange={(e) => setForm({ ...form, hazardousDetails: e.target.value })} />
          <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Save Record</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

