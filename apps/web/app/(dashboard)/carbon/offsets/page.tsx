'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { OFFSET_TYPES, VERIFICATION_STATUSES } from '@/modules/carbon/constants.js';

export default function OffsetsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    offsetType: 'carbon_credit' as const,
    registry: '',
    registryId: '',
    creditsPurchased: '',
    purchaseDate: '',
    costPerTon: '',
    projectId: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'offsets'],
    queryFn: () => carbonService.listOffsets({ limit: 50 }),
  });

  const projectsQuery = useQuery({
    queryKey: ['carbon', 'projects'],
    queryFn: () => carbonService.listProjects({ limit: 50 }),
  });

  const offsets = data ?? [];

  const filtered = offsets.filter((o: any) => {
    const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase());
    const matchesProject = !projectFilter || o.projectId === projectFilter;
    const matchesType = !typeFilter || o.offsetType === typeFilter;
    const matchesVerification = !verificationFilter || o.verificationStatus === verificationFilter;
    return matchesSearch && matchesProject && matchesType && matchesVerification;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      offsetType: 'carbon_credit',
      registry: '',
      registryId: '',
      creditsPurchased: '',
      purchaseDate: '',
      costPerTon: '',
      projectId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || null,
      offsetType: formData.offsetType,
      registry: formData.registry || null,
      registryId: formData.registryId || null,
      creditsPurchased: parseFloat(formData.creditsPurchased) || 0,
      purchaseDate: formData.purchaseDate,
      costPerTon: formData.costPerTon ? parseFloat(formData.costPerTon) : null,
      projectId: formData.projectId || null,
    };
    if (editingId) {
      await carbonService.updateOffset(editingId, payload);
    } else {
      await carbonService.createOffset(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'offsets'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (o: any) => {
    setEditingId(o.id);
    setFormData({
      name: o.name,
      description: o.description ?? '',
      offsetType: o.offsetType,
      registry: o.registry ?? '',
      registryId: o.registryId ?? '',
      creditsPurchased: String(o.creditsPurchased),
      purchaseDate: o.purchaseDate,
      costPerTon: o.costPerTon?.toString() ?? '',
      projectId: o.projectId ?? '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carbon Offsets</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Offset
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Offset' : 'New Offset'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.offsetType}
                onChange={(e) => setFormData({ ...formData, offsetType: e.target.value as any })}
              >
                {OFFSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Registry</label>
              <Input value={formData.registry} onChange={(e) => setFormData({ ...formData, registry: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Registry ID</label>
              <Input value={formData.registryId} onChange={(e) => setFormData({ ...formData, registryId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Credits Purchased</label>
              <Input type="number" value={formData.creditsPurchased} onChange={(e) => setFormData({ ...formData, creditsPurchased: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Purchase Date</label>
              <Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Cost Per Ton</label>
              <Input type="number" step="0.01" value={formData.costPerTon} onChange={(e) => setFormData({ ...formData, costPerTon: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Project</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">None</option>
                {projectsQuery.data?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
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
            <Input placeholder="Search offsets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {OFFSET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {VERIFICATION_STATUSES.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
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
          <p className="text-sm text-red-500">Failed to load offsets.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No offsets found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Credits</th>
                  <th className="pb-2 font-medium">Cost/Ton</th>
                  <th className="pb-2 font-medium">Verification</th>
                  <th className="pb-2 font-medium">Purchase Date</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} className="border-b">
                    <td className="py-2 font-medium">{o.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{o.offsetType}</td>
                    <td className="py-2">{o.creditsPurchased}</td>
                    <td className="py-2">{o.costPerTon ? `$${o.costPerTon}` : '-'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${o.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : o.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {o.verificationStatus}
                      </span>
                    </td>
                    <td className="py-2 text-[rgb(var(--muted))]">{o.purchaseDate}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(o)}><Edit className="h-4 w-4" /></Button>
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