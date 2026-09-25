'use client';

import { useState } from 'react';
import { PlusCircle, Trash2, Edit, Search, Filter } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { EMISSION_SCOPE_OPTIONS, CALCULATION_METHODS, REPORTING_PERIODS } from '@/modules/carbon/constants.js';

export default function EmissionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');

  const [formData, setFormData] = useState({
    activityType: '',
    activityData: '',
    emissionDate: '',
    reportingPeriod: 'monthly' as const,
    scopeId: '',
    co2e: '',
    co2: '',
    ch4: '',
    n2o: '',
    calculationMethod: 'standard' as const,
    emissionFactorId: '',
    notes: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['carbon', 'emissions'],
    queryFn: () => carbonService.listEmissions({ limit: 50 }),
  });

  const scopesQuery = useQuery({
    queryKey: ['carbon', 'scopes'],
    queryFn: () => carbonService.listScopes({ limit: 50 }),
  });

  const sourcesQuery = useQuery({
    queryKey: ['carbon', 'emissionSources'],
    queryFn: () => carbonService.listEmissionSources({ limit: 50 }),
  });

  const facilitiesQuery = useQuery({
    queryKey: ['carbon', 'facilities'],
    queryFn: () => carbonService.listFacilities({ limit: 50 }),
  });

  const emissions = data ?? [];

  const filtered = emissions.filter((e: any) => {
    const matchesScope = !scopeFilter || e.scopeId === scopeFilter;
    const matchesFacility = !facilityFilter || e.facilityId === facilityFilter;
    const matchesSource = !sourceFilter || e.emissionSourceId === sourceFilter;
    const matchesPeriod = !periodFilter || e.reportingPeriod === periodFilter;
    return matchesScope && matchesFacility && matchesSource && matchesPeriod;
  });

  const resetForm = () => {
    setFormData({
      activityType: '',
      activityData: '',
      emissionDate: '',
      reportingPeriod: 'monthly',
      scopeId: '',
      co2e: '',
      co2: '',
      ch4: '',
      n2o: '',
      calculationMethod: 'standard',
      emissionFactorId: '',
      notes: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activityType: formData.activityType,
      activityData: formData.activityData ? JSON.parse(formData.activityData) : {},
      emissionDate: formData.emissionDate,
      reportingPeriod: formData.reportingPeriod,
      scopeId: formData.scopeId || null,
      co2e: parseFloat(formData.co2e) || 0,
      co2: formData.co2 ? parseFloat(formData.co2) : null,
      ch4: formData.ch4 ? parseFloat(formData.ch4) : null,
      n2o: formData.n2o ? parseFloat(formData.n2o) : null,
      calculationMethod: formData.calculationMethod,
      emissionFactorId: formData.emissionFactorId || null,
      notes: formData.notes || null,
    };
    if (editingId) {
      await carbonService.updateEmission(editingId, payload);
    } else {
      await carbonService.createEmission(payload);
    }
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissions'] });
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (e: any) => {
    setEditingId(e.id);
    setFormData({
      activityType: e.activityType,
      activityData: JSON.stringify(e.activityData, null, 2),
      emissionDate: e.emissionDate,
      reportingPeriod: e.reportingPeriod,
      scopeId: e.scopeId ?? '',
      co2e: String(e.co2e),
      co2: e.co2?.toString() ?? '',
      ch4: e.ch4?.toString() ?? '',
      n2o: e.n2o?.toString() ?? '',
      calculationMethod: e.calculationMethod,
      emissionFactorId: e.emissionFactorId ?? '',
      notes: e.notes ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await carbonService.deleteEmission(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'emissions'] });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Emissions</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />New Record
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{editingId ? 'Edit Emission Record' : 'New Emission Record'}</h3>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Activity Type</label>
              <Input value={formData.activityType} onChange={(e) => setFormData({ ...formData, activityType: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Activity Data (JSON)</label>
              <Input value={formData.activityData} onChange={(e) => setFormData({ ...formData, activityData: e.target.value })} placeholder='{"value": 100}' />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Emission Date</label>
              <Input type="date" value={formData.emissionDate} onChange={(e) => setFormData({ ...formData, emissionDate: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Reporting Period</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.reportingPeriod}
                onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value as any })}
              >
                {REPORTING_PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Scope</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.scopeId}
                onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
              >
                <option value="">None</option>
                {scopesQuery.data?.map((s: any) => (
                  <option key={s.id} value={s.id}>Scope {s.scopeNumber} - {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">CO2e (t)</label>
              <Input type="number" step="0.01" value={formData.co2e} onChange={(e) => setFormData({ ...formData, co2e: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">CO2 (t)</label>
              <Input type="number" step="0.01" value={formData.co2} onChange={(e) => setFormData({ ...formData, co2: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">CH4 (t)</label>
              <Input type="number" step="0.01" value={formData.ch4} onChange={(e) => setFormData({ ...formData, ch4: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">N2O (t)</label>
              <Input type="number" step="0.01" value={formData.n2o} onChange={(e) => setFormData({ ...formData, n2o: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Calculation Method</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.calculationMethod}
                onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as any })}
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Source</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="">None</option>
                {sourcesQuery.data?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[rgb(var(--muted))]">Notes</label>
              <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
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
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="">All Scopes</option>
            {EMISSION_SCOPE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={facilityFilter} onChange={(e) => setFacilityFilter(e.target.value)}>
            <option value="">All Facilities</option>
            {facilitiesQuery.data?.map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            {sourcesQuery.data?.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select className="rounded border border-input bg-background px-3 py-2 text-sm" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="">All Periods</option>
            {REPORTING_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
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
          <p className="text-sm text-red-500">Failed to load emissions.</p>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No carbon data available</p>
            <Button className="mt-3" variant="outline" onClick={() => { resetForm(); setShowForm(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" />Add Record
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Activity</th>
                  <th className="pb-2 font-medium">CO2e (t)</th>
                  <th className="pb-2 font-medium">Scope</th>
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e: any) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2 font-medium">{e.activityType}</td>
                    <td className="py-2">{e.co2e}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{e.scopeId ? `Scope ${scopesQuery.data?.find((s: any) => s.id === e.scopeId)?.scopeNumber ?? '?'}` : 'N/A'}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{e.reportingPeriod}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{e.emissionDate}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(e)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
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