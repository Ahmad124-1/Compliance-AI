'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { FACILITY_TYPES } from '@/modules/carbon/constants.js';

export default function FacilitiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    facilityType: 'factory' as const,
    address: '',
    latitude: '',
    longitude: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'facilities'],
    queryFn: () => carbonService.listFacilities({ limit: 50 }),
  });

  const facilities = data ?? [];

  const filtered = facilities.filter((f: any) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || f.facilityType === typeFilter;
    return matchesSearch && matchesType;
  });

  const resetForm = () => {
    setFormData({ name: '', facilityType: 'factory', address: '', latitude: '', longitude: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      facilityType: formData.facilityType,
      address: { street: formData.address },
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };
    if (editingId) {
      await carbonService.updateFacility(editingId, payload);
    } else {
      await carbonService.createFacility(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'facilities'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setFormData({
      name: f.name,
      facilityType: f.facilityType,
      address: f.address?.street ?? '',
      latitude: f.latitude?.toString() ?? '',
      longitude: f.longitude?.toString() ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await carbonService.deleteFacility(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'facilities'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Facilities</h2>
        <Button asChild>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" />New Facility
          </Button>
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Facility' : 'New Facility'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.facilityType}
                onChange={(e) => setFormData({ ...formData, facilityType: e.target.value as any })}
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[rgb(var(--muted))]">Address</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Latitude</label>
              <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Longitude</label>
              <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} />
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
            <Input placeholder="Search facilities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
          </div>
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map((t) => (
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
          <p className="text-sm text-red-500">Failed to load facilities.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No facilities found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f: any) => (
                  <tr key={f.id} className="border-b">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{f.facilityType}</td>
                    <td className="py-2">{f.isActive ? 'Active' : 'Inactive'}</td>
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