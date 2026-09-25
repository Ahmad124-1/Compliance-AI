'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { masterDataLookup } from '@/modules/data-hub/service.js';
import { EMISSION_SOURCE_CATEGORIES, EMISSION_SOURCE_TYPES } from '@/modules/carbon/constants.js';

export default function EmissionSourcesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sourceCategory: 'fuel_consumption' as const,
    sourceType: 'diesel' as const,
    description: '',
    facilityId: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'emissionSources'],
    queryFn: () => carbonService.listEmissionSources({ limit: 50 }),
  });

  const facilitiesQuery = useQuery({
    queryKey: ['data-hub', 'sync', 'lookup', 'facility'],
    queryFn: () => masterDataLookup.facilities(),
  });

  const sources = data ?? [];

  const filtered = sources.filter((s: any) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFacility = !facilityFilter || s.facilityId === facilityFilter;
    const matchesCategory = !categoryFilter || s.sourceCategory === categoryFilter;
    const matchesType = !typeFilter || s.sourceType === typeFilter;
    return matchesSearch && matchesFacility && matchesCategory && matchesType;
  });

  const resetForm = () => {
    setFormData({ name: '', sourceCategory: 'fuel_consumption', sourceType: 'diesel', description: '', facilityId: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      sourceCategory: formData.sourceCategory,
      sourceType: formData.sourceType,
      description: formData.description,
      facilityId: formData.facilityId || null,
    };
    if (editingId) {
      await carbonService.updateEmissionSource(editingId, payload);
    } else {
      await carbonService.createEmissionSource(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissionSources'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      sourceCategory: s.sourceCategory,
      sourceType: s.sourceType,
      description: s.description ?? '',
      facilityId: s.facilityId ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await carbonService.deleteEmissionSource(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissionSources'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emission Sources</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Source
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Emission Source' : 'New Emission Source'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Category</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.sourceCategory}
                onChange={(e) => {
                  setFormData({ ...formData, sourceCategory: e.target.value as any });
                  const cat = EMISSION_SOURCE_TYPES.find((t) => t.value === e.target.value);
                  if (cat) setFormData({ ...formData, sourceType: e.target.value as any });
                }}
              >
                {EMISSION_SOURCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as any })}
              >
                {EMISSION_SOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Facility</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.facilityId}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
              >
                <option value="">None</option>
                {facilitiesQuery.data?.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
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
            <Input placeholder="Search sources..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)}>
            <option value="">All Facilities</option>
            {facilitiesQuery.data?.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {EMISSION_SOURCE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {EMISSION_SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
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
          <p className="text-sm text-red-500">Failed to load emission sources.</p>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No carbon data available</p>
            <Button className="mt-3" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />Add Source
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{s.sourceCategory}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{s.sourceType}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
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