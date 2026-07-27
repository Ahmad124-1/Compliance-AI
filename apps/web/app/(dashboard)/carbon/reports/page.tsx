'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { CARBON_REPORT_TYPES, REPORT_FORMATS } from '@/modules/carbon/constants.js';

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reportType: 'carbon_inventory' as const,
    format: 'pdf' as const,
    status: 'draft' as const,
    facilityId: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'reports'],
    queryFn: () => carbonService.listReports({ limit: 50 }),
  });

  const facilitiesQuery = useQuery({
    queryKey: ['carbon', 'facilities'],
    queryFn: () => carbonService.listFacilities({ limit: 50 }),
  });

  const reports = data ?? [];

  const filtered = reports.filter((r: any) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || r.reportType === typeFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      reportType: 'carbon_inventory',
      format: 'pdf',
      status: 'draft',
      facilityId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || null,
      reportType: formData.reportType,
      format: formData.format,
      status: formData.status,
      facilityId: formData.facilityId || null,
    };
    if (editingId) {
      await carbonService.updateReport(editingId, payload);
    } else {
      await carbonService.createReport(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'reports'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (r: any) => {
    setEditingId(r.id);
    setFormData({
      name: r.name,
      description: r.description ?? '',
      reportType: r.reportType,
      format: r.format,
      status: r.status,
      facilityId: r.facilityId ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carbon Reports</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />Generate Report
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Report' : 'Generate New Report'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Report Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Report Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
              >
                {CARBON_REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Format</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              >
                {REPORT_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Status</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="draft">Draft</option>
                <option value="generated">Generated</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Facility</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.facilityId}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
              >
                <option value="">All Facilities</option>
                {facilitiesQuery.data?.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[rgb(var(--muted))]">Description</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Generate'}</Button>
              <Button variant="outline" type="button" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[rgb(var(--muted))]" />
            <Input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {CARBON_REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load reports.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No reports found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Format</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Generated By</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 font-medium">{r.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{r.reportType}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{r.format.toUpperCase()}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'generated' ? 'bg-blue-100 text-blue-800' : r.status === 'archived' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 text-[rgb(var(--muted))]">{r.generatedBy ?? '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}