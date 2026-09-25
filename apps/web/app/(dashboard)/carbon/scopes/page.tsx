'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { EMISSION_SCOPE_OPTIONS } from '@/modules/carbon/constants.js';

export default function ScopesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    scopeNumber: 1 as 1 | 2 | 3,
    description: '',
  });

  const { data: scopesData, isLoading: scopesLoading } = useQuery({
    queryKey: ['carbon', 'scopes'],
    queryFn: () => carbonService.listScopes({ limit: 50 }),
  });

  const { data: emissionsData, isLoading: emissionsLoading } = useQuery({
    queryKey: ['carbon', 'emissions'],
    queryFn: () => carbonService.listEmissions({ limit: 100 }),
  });

  const scopes = scopesData ?? [];
  const emissions = emissionsData ?? [];

  const filtered = scopeFilter ? scopes.filter((s: any) => String(s.scopeNumber) === scopeFilter) : scopes;

  const resetForm = () => {
    setFormData({ name: '', scopeNumber: 1, description: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      scopeNumber: formData.scopeNumber,
      description: formData.description,
    };
    if (editingId) {
      await carbonService.updateScope(editingId, payload);
    } else {
      await carbonService.createScope(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'scopes'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({ name: s.name, scopeNumber: s.scopeNumber, description: s.description ?? '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">GHG Scopes</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Scope
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Scope' : 'New Scope'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Scope Number</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.scopeNumber}
                onChange={(e) => setFormData({ ...formData, scopeNumber: parseInt(e.target.value) as 1 | 2 | 3 })}
              >
                {EMISSION_SCOPE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
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

      <div className="grid gap-4 md:grid-cols-3">
        {filtered.map((s: any) => {
          const scopeEmissions = emissions.filter((e: any) => e.scopeId === s.id);
          const handleDelete = async (id: string) => {
    await carbonService.deleteScope(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'scopes'] });
  };

  return (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{s.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Scope {s.scopeNumber}</span>
              </div>
              {s.description && <p className="mb-3 text-xs text-[rgb(var(--muted))]">{s.description}</p>}
              <div className="mb-3">
                <p className="text-lg font-semibold">{scopeEmissions.length}</p>
                <p className="text-xs text-[rgb(var(--muted))]">emission records</p>
              </div>
              {scopeEmissions.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {scopeEmissions.slice(0, 3).map((e: any) => (
                    <li key={e.id} className="text-xs text-[rgb(var(--muted))]">{e.activityType}: {e.co2e} tCO2e</li>
                  ))}
                  {scopeEmissions.length > 3 && <li className="text-xs text-[rgb(var(--muted))]">+{scopeEmissions.length - 3} more</li>}
                </ul>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}