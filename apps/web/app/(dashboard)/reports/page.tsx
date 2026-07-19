'use client';

import { useMemo, useState } from 'react';
import { FileDown, FileText, PlusCircle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/modules/reports/service.js';
import { REPORT_FORMATS, REPORT_TYPES } from '@/modules/reports/constants.js';

export default function ReportsDashboardPage() {
  const [type, setType] = useState('audit');
  const [format, setFormat] = useState('pdf');
  const [title, setTitle] = useState('Executive compliance report');

  const templatesQuery = useQuery({ queryKey: ['reports', 'templates'], queryFn: () => reportsService.listTemplates() });

  const sampleTemplates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const handleGenerate = async () => {
    await reportsService.generate({ type: type as any, format: format as any, title, includeCharts: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Exports</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Generate audit, assessment, CAPA, and executive reports in PDF, Excel, CSV, or print view.</p>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Report builder</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-[rgb(var(--muted))]">Report type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
              {REPORT_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-[rgb(var(--muted))]">Export format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm">
              {REPORT_FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <label className="mt-4 block space-y-1 text-sm">
          <span className="text-[rgb(var(--muted))]">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--card))] px-3 text-sm" />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerate}><PlusCircle className="mr-2 h-4 w-4" />Generate report</Button>
          <Button variant="outline">Save template</Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileDown className="h-4 w-4 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Templates & exports</h2>
        </div>
        <div className="space-y-2">
          {sampleTemplates.length ? sampleTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{template.type} · {template.format}</p>
              </div>
              <Button variant="outline" size="sm">Use</Button>
            </div>
          )) : <p className="text-sm text-[rgb(var(--muted))]">No report templates available yet. Create one from the builder.</p>}
        </div>
      </Card>
    </div>
  );
}
