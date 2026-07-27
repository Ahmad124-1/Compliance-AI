'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/modules/carbon/constants.js';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'solar_installation' as const,
    status: 'planning' as const,
    budget: '',
    ownerId: '',
    startDate: '',
    endDate: '',
    expectedReduction: '',
    facilityId: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'projects'],
    queryFn: () => carbonService.listProjects({ limit: 50 }),
  });

  const projects = data ?? [];

  const filtered = projects.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || p.projectType === typeFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      projectType: 'solar_installation',
      status: 'planning',
      budget: '',
      ownerId: '',
      startDate: '',
      endDate: '',
      expectedReduction: '',
      facilityId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || null,
      projectType: formData.projectType,
      status: formData.status,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      ownerId: formData.ownerId || null,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      expectedReductionTco2e: formData.expectedReduction ? parseFloat(formData.expectedReduction) : null,
      facilityId: formData.facilityId || null,
    };
    if (editingId) {
      await carbonService.updateProject(editingId, payload);
    } else {
      await carbonService.createProject(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'projects'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      description: p.description ?? '',
      projectType: p.projectType,
      status: p.status,
      budget: p.budget?.toString() ?? '',
      ownerId: p.ownerId ?? '',
      startDate: p.startDate ?? '',
      endDate: p.endDate ?? '',
      expectedReduction: p.expectedReductionTco2e?.toString() ?? '',
      facilityId: p.facilityId ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reduction Projects</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Project
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Project' : 'New Project'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value as any })}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
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
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Budget</label>
              <Input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Owner ID</label>
              <Input value={formData.ownerId} onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Start Date</label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">End Date</label>
              <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Expected Reduction (tCO2e)</label>
              <Input type="number" step="0.01" value={formData.expectedReduction} onChange={(e) => setFormData({ ...formData, expectedReduction: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Facility</label>
              <Input value={formData.facilityId} onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[rgb(var(--muted))]">Description</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              <Button variant="outline" type="button" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[rgb(var(--muted))]" />
            <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load projects.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No projects found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Budget</th>
                  <th className="pb-2 font-medium">Expected Reduction</th>
                  <th className="pb-2 font-medium">ROI</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{p.projectType}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : p.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
                    </td>
                    <td className="py-2">{p.budget ? `$${p.budget.toLocaleString()}` : '-'}</td>
                    <td className="py-2">{p.expectedReductionTco2e ?? '-'} tCO2e</td>
                    <td className="py-2">{p.roi != null ? `${p.roi}%` : '-'}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
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