'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { masterDataLookup } from '@/modules/data-hub/service.js';
import { TARGET_TYPES, TARGET_STATUSES } from '@/modules/carbon/constants.js';

export default function TargetsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetType: 'net_zero' as const,
    baselineEmissions: '',
    targetEmissions: '',
    baselineYear: '',
    targetYear: '',
    facilityId: '',
    scopeId: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'targets'],
    queryFn: () => carbonService.listTargets({ limit: 50 }),
  });

  const scopesQuery = useQuery({
    queryKey: ['carbon', 'scopes'],
    queryFn: () => carbonService.listScopes({ limit: 50 }),
  });

  const facilitiesQuery = useQuery({
    queryKey: ['data-hub', 'sync', 'lookup', 'facility'],
    queryFn: () => masterDataLookup.facilities(),
  });

  const targets = data ?? [];

  const filtered = targets.filter((t: any) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || t.targetType === typeFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      targetType: 'net_zero',
      baselineEmissions: '',
      targetEmissions: '',
      baselineYear: '',
      targetYear: '',
      facilityId: '',
      scopeId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description || null,
      targetType: formData.targetType,
      baselineEmissionsTco2e: parseFloat(formData.baselineEmissions) || 0,
      targetEmissionsTco2e: parseFloat(formData.targetEmissions) || 0,
      baselineYear: parseInt(formData.baselineYear) || new Date().getFullYear(),
      targetYear: parseInt(formData.targetYear) || new Date().getFullYear() + 5,
      facilityId: formData.facilityId || null,
      scopeId: formData.scopeId || null,
    };
    if (editingId) {
      await carbonService.updateTarget(editingId, payload);
    } else {
      await carbonService.createTarget(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'targets'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setFormData({
      name: t.name,
      description: t.description ?? '',
      targetType: t.targetType,
      baselineEmissions: String(t.baselineEmissionsTco2e),
      targetEmissions: String(t.targetEmissionsTco2e),
      baselineYear: String(t.baselineYear),
      targetYear: String(t.targetYear),
      facilityId: t.facilityId ?? '',
      scopeId: t.scopeId ?? '',
    });
    setShowForm(true);
  };

  const TARGET_STATUS_COLORS: Record<string, string> = {
    achieved: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    at_risk: 'bg-red-100 text-red-800',
    not_started: 'bg-gray-100 text-gray-800',
    missed: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-200 text-gray-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reduction Targets</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Target
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Target' : 'New Target'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.targetType}
                onChange={(e) => setFormData({ ...formData, targetType: e.target.value as any })}
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Baseline Emissions (tCO2e)</label>
              <Input type="number" step="0.01" value={formData.baselineEmissions} onChange={(e) => setFormData({ ...formData, baselineEmissions: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Target Emissions (tCO2e)</label>
              <Input type="number" step="0.01" value={formData.targetEmissions} onChange={(e) => setFormData({ ...formData, targetEmissions: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Baseline Year</label>
              <Input type="number" value={formData.baselineYear} onChange={(e) => setFormData({ ...formData, baselineYear: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Target Year</label>
              <Input type="number" value={formData.targetYear} onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Facility</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.facilityId}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
              >
                <option value="">No facility</option>
                {facilitiesQuery.data?.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Scope</label>
              <Input value={formData.scopeId} onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })} />
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

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((t: any) => {
          const progress = Math.min(100, Math.max(0, ((t.baselineEmissionsTco2e - t.currentEmissionsTco2e) / Math.max(1, t.baselineEmissionsTco2e)) * 100));
          const targetProgress = t.baselineEmissionsTco2e > 0 ? ((t.baselineEmissionsTco2e - t.targetEmissionsTco2e) / t.baselineEmissionsTco2e) * 100 : 0;
          const handleDelete = async (id: string) => {
    await carbonService.deleteTarget(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'targets'] });
  };

  return (
            <Card key={t.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{t.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${TARGET_STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-800'}`}>{t.status}</span>
              </div>
              {t.description && <p className="mb-2 text-xs text-[rgb(var(--muted))]">{t.description}</p>}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-[rgb(var(--muted))] mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[rgb(var(--muted))]">
                  <div className="h-2 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[rgb(var(--muted))]">Baseline</p>
                  <p className="font-medium">{t.baselineEmissionsTco2e} tCO2e ({t.baselineYear})</p>
                </div>
                <div>
                  <p className="text-[rgb(var(--muted))]">Target</p>
                  <p className="font-medium">{t.targetEmissionsTco2e} tCO2e ({t.targetYear})</p>
                </div>
                <div>
                  <p className="text-[rgb(var(--muted))]">Current</p>
                  <p className="font-medium">{t.currentEmissionsTco2e ?? '-'} tCO2e</p>
                </div>
                <div>
                  <p className="text-[rgb(var(--muted))]">Target Reduction</p>
                  <p className="font-medium">{Math.round(targetProgress)}%</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">Failed to load targets.</p>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No carbon data available</p>
            <Button className="mt-3" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />Add Target
            </Button>
          </div>
      ) : null}
    </div>
  );
}