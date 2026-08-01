'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { WATER_SOURCE_TYPES } from '@/modules/environment/constants.js';

export default function NewWaterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    sourceType: 'municipal',
    consumptionDate: '',
    consumptionAmount: '',
    unit: 'm3',
    dischargeAmount: '',
    treatmentMethod: '',
    reuseAmount: '0',
    leakDetected: false,
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createWater(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'water'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/water');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      consumptionAmount: Number(form.consumptionAmount),
      dischargeAmount: form.dischargeAmount ? Number(form.dischargeAmount) : null,
      reuseAmount: Number(form.reuseAmount),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Log Water Usage</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Record water consumption and discharge data.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Source Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} required>
              {WATER_SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input type="date" placeholder="Consumption Date" value={form.consumptionDate} onChange={(e) => setForm({ ...form, consumptionDate: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Consumption Amount" value={form.consumptionAmount} onChange={(e) => setForm({ ...form, consumptionAmount: e.target.value })} required />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Discharge Amount" value={form.dischargeAmount} onChange={(e) => setForm({ ...form, dischargeAmount: e.target.value })} />
            <Input placeholder="Treatment Method" value={form.treatmentMethod} onChange={(e) => setForm({ ...form, treatmentMethod: e.target.value })} />
          </div>
          <Input type="number" placeholder="Reuse Amount" value={form.reuseAmount} onChange={(e) => setForm({ ...form, reuseAmount: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.leakDetected} onChange={(e) => setForm({ ...form, leakDetected: e.target.checked })} />
            Leak Detected
          </label>
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

