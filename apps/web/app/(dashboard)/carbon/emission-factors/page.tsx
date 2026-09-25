'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { FACTOR_TYPES } from '@/modules/carbon/constants.js';

export default function EmissionFactorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    factorType: 'electricity' as const,
    category: '',
    subcategory: '',
    value: '',
    unit: '',
    source: '',
    sourceUrl: '',
    geography: '',
    effectiveDate: '',
    expiryDate: '',
    version: 1,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'emissionFactors'],
    queryFn: () => carbonService.listEmissionFactors({ limit: 50 }),
  });

  const factors = data ?? [];

  const filtered = factors.filter((f: any) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || f.factorType === typeFilter;
    const matchesCategory = !categoryFilter || f.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      factorType: 'electricity',
      category: '',
      subcategory: '',
      value: '',
      unit: '',
      source: '',
      sourceUrl: '',
      geography: '',
      effectiveDate: '',
      expiryDate: '',
      version: 1,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || null,
      factorType: formData.factorType,
      category: formData.category,
      subcategory: formData.subcategory || null,
      value: parseFloat(formData.value) || 0,
      unit: formData.unit,
      source: formData.source,
      sourceUrl: formData.sourceUrl || null,
      geography: formData.geography || null,
      effectiveDate: formData.effectiveDate,
      expiryDate: formData.expiryDate || null,
      version: formData.version || 1,
    };
    if (editingId) {
      await carbonService.updateEmissionFactor(editingId, payload);
    } else {
      await carbonService.createEmissionFactor(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissionFactors'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setFormData({
      name: f.name,
      description: f.description ?? '',
      factorType: f.factorType,
      category: f.category,
      subcategory: f.subcategory ?? '',
      value: String(f.value),
      unit: f.unit,
      source: f.source,
      sourceUrl: f.sourceUrl ?? '',
      geography: f.geography ?? '',
      effectiveDate: f.effectiveDate,
      expiryDate: f.expiryDate ?? '',
      version: f.version,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await carbonService.deleteEmissionFactor(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissionFactors'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emission Factors</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Factor
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Factor' : 'New Factor'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.factorType}
                onChange={(e) => setFormData({ ...formData, factorType: e.target.value as any })}
              >
                {FACTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Category</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Subcategory</label>
              <Input value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Value</label>
              <Input type="number" step="any" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Unit</label>
              <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Source</label>
              <Input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Version</label>
              <Input type="number" value={String(formData.version)} onChange={(e) => setFormData({ ...formData, version: parseInt(e.target.value) || 1 })} min={1} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Effective Date</label>
              <Input type="date" value={formData.effectiveDate} onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Expiry Date</label>
              <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Geography</label>
              <Input value={formData.geography} onChange={(e) => setFormData({ ...formData, geography: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Source URL</label>
              <Input value={formData.sourceUrl} onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })} />
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
            <Input placeholder="Search factors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {FACTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Input placeholder="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">Failed to load emission factors.</p>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No carbon data available</p>
            <Button className="mt-3" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />Add Factor
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium">Unit</th>
                  <th className="pb-2 font-medium">Version</th>
                  <th className="pb-2 font-medium">Effective</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f: any) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{f.factorType}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{f.category}</td>
                    <td className="py-2">{f.value}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{f.unit}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">v{f.version}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{f.effectiveDate}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(f)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4" /></Button>
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