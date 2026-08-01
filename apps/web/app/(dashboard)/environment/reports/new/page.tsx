'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { ENVIRONMENTAL_REPORT_TYPES, ENVIRONMENT_REPORT_FORMATS, REPORT_SCHEDULES } from '@/modules/environment/constants.js';

export default function NewEnvironmentalReportPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    reportType: 'environmental',
    format: 'pdf',
    description: '',
    schedule: 'none',
    params: '{}',
  });

  const createMutation = useMutation({
    mutationFn: (input: Record<string, unknown>) => environmentService.createReport(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['environment', 'reports'] });
      router.push('/dashboard/environment/reports');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      params: JSON.parse(form.params || '{}'),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">New Environmental Report</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Generate environmental reports in various formats.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Report Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Report Type</label>
            <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
              value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}>
              {ENVIRONMENTAL_REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
<div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Format</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                {ENVIRONMENT_REPORT_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Schedule</label>
              <select className="w-full rounded border border-[rgb(var(--border-color))] bg-transparent p-2 text-sm"
                value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })}>
                {REPORT_SCHEDULES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Textarea placeholder='Report params JSON (e.g. {"facilityId":"..."})' value={form.params} onChange={(e) => setForm({ ...form, params: e.target.value })} />
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending}>Generate Report</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
