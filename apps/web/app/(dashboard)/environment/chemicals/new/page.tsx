'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { HAZARD_CLASSIFICATIONS } from '@/modules/environment/constants.js';

export default function NewChemicalPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    casNumber: '',
    hazardClass: 'flammable',
    quantity: '',
    unit: 'kg',
    supplier: '',
    manufacturer: '',
    location: '',
    storageArea: '',
    safetyDataSheetUrl: '',
    description: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createChemical(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'chemicals'] });
      qc.invalidateQueries({ queryKey: ['environment', 'dashboard'] });
      router.push('/dashboard/environment/chemicals');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Add Chemical</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Register a chemical substance in your inventory.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Chemical Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="CAS Number" value={form.casNumber} onChange={(e) => setForm({ ...form, casNumber: e.target.value })} />
            <div>
              <label className="mb-1 block text-sm font-medium">Hazard Classification</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.hazardClass} onChange={(e) => setForm({ ...form, hazardClass: e.target.value })} required>
                {HAZARD_CLASSIFICATIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <Input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            <Input placeholder="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="Storage Area" value={form.storageArea} onChange={(e) => setForm({ ...form, storageArea: e.target.value })} />
          </div>
          <Input placeholder="Safety Data Sheet URL" value={form.safetyDataSheetUrl} onChange={(e) => setForm({ ...form, safetyDataSheetUrl: e.target.value })} />
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Save Chemical</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
