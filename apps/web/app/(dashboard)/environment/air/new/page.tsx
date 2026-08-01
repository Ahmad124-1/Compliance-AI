'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { AIR_EMISSION_TYPES, MONITORING_FREQUENCIES } from '@/modules/environment/constants.js';

export default function NewAirPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    emissionType: 'stack',
    emissionDate: '',
    quantity: '',
    unit: 'kg',
    monitoringFrequency: 'monthly',
    reportingPeriod: '',
    emissionLimit: '',
    concentration: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createAir(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'air'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/air');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
      emissionLimit: form.emissionLimit ? Number(form.emissionLimit) : null,
      concentration: form.concentration ? Number(form.concentration) : null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Add Air Emission</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Record stack, boiler, generator, or pollutant emissions.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Emission Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.emissionType} onChange={(e) => setForm({ ...form, emissionType: e.target.value })} required>
              {AIR_EMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input type="date" placeholder="Emission Date" value={form.emissionDate} onChange={(e) => setForm({ ...form, emissionDate: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Monitoring Frequency</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.monitoringFrequency} onChange={(e) => setForm({ ...form, monitoringFrequency: e.target.value })}>
              {MONITORING_FREQUENCIES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input placeholder="Reporting Period" value={form.reportingPeriod} onChange={(e) => setForm({ ...form, reportingPeriod: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Emission Limit" value={form.emissionLimit} onChange={(e) => setForm({ ...form, emissionLimit: e.target.value })} />
            <Input type="number" placeholder="Concentration" value={form.concentration} onChange={(e) => setForm({ ...form, concentration: e.target.value })} />
          </div>
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

