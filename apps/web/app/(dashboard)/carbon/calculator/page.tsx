'use client';

import { useState } from 'react';
import { Calculator as CalcIcon, History, Trash2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { carbonService } from '@/modules/carbon/service.js';
import { CALCULATION_METHODS, FACTOR_TYPES } from '@/modules/carbon/constants.js';

export default function CalculatorPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{ result: Record<string, unknown>; calculationId: string; emissionFactor: Record<string, unknown> } | null>(null);
  const [formData, setFormData] = useState({
    activityValue: '',
    factorType: 'electricity',
    category: '',
    geography: '',
    calculationMethod: 'standard',
  });

  const calculationsQuery = useQuery({
    queryKey: ['carbon', 'calculations'],
    queryFn: () => carbonService.listCalculations(),
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activityValue: parseFloat(formData.activityValue) || 0,
      factorType: formData.factorType,
      category: formData.category,
      geography: formData.geography || undefined,
      calculationMethod: formData.calculationMethod,
    };
    const res = await carbonService.calculateEmissions(payload);
    setResult(res as { result: Record<string, unknown>; calculationId: string; emissionFactor: Record<string, unknown> });
    queryClient.invalidateQueries({ queryKey: ['carbon', 'calculations'] });
  };

  const handleDeleteCalculation = async (id: string) => {
    await carbonService.deleteCalculation(id);
    queryClient.invalidateQueries({ queryKey: ['carbon', 'calculations'] });
  };

  const breakdown = result?.result as Record<string, number> | undefined;
  const resultCo2e = breakdown?.co2e ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Emission Calculator</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Calculate emissions based on activity data and emission factors.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Calculate Emissions</h2>
          <form onSubmit={handleCalculate} className="grid gap-3">
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Activity Value</label>
              <Input type="number" step="any" value={formData.activityValue} onChange={(e) => setFormData({ ...formData, activityValue: e.target.value })} placeholder="e.g. 1000" required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Factor Type</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.factorType}
                onChange={(e) => setFormData({ ...formData, factorType: e.target.value as 'electricity' | 'fuel' | 'waste' | 'travel' | 'supplier' | 'country' | 'custom' })}
              >
                {FACTOR_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Category</label>
              <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. electricity" required />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Geography</label>
              <Input value={formData.geography} onChange={(e) => setFormData({ ...formData, geography: e.target.value })} placeholder="e.g. US" />
            </div>
            <div>
              <label className="text-xs text-[rgb(var(--muted))]">Calculation Method</label>
              <select
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.calculationMethod}
                onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value as 'standard' | 'mass_balance' | 'engineering_estimate' | 'metered_data' | 'manual' })}
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="mt-2">
              <CalcIcon className="mr-2 h-4 w-4" />Calculate
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold">Calculation Result</h2>
          {!result ? (
            <p className="text-sm text-[rgb(var(--muted))]">Enter values and click Calculate to see results.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 text-center">
                <p className="text-xs text-green-700 dark:text-green-300">Total CO2e</p>
                <p className="text-3xl font-semibold text-green-900 dark:text-green-100">{resultCo2e.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400">tCO2e</p>
              </div>
              {breakdown && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 rounded bg-blue-50 dark:bg-blue-950 text-center">
                    <p className="text-xs text-blue-700 dark:text-blue-300">CO2</p>
                    <p className="font-semibold">{(breakdown.co2 ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded bg-orange-50 dark:bg-orange-950 text-center">
                    <p className="text-xs text-orange-700 dark:text-orange-300">CH4</p>
                    <p className="font-semibold">{(breakdown.ch4 ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-950 text-center">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">N2O</p>
                    <p className="font-semibold">{(breakdown.n2o ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded bg-purple-50 dark:bg-purple-950 text-center">
                    <p className="text-xs text-purple-700 dark:text-purple-300">Other GHG</p>
                    <p className="font-semibold">{(breakdown.other ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
              <div className="text-xs text-[rgb(var(--muted))] space-y-1">
                <p><strong>Method:</strong> {(result.emissionFactor?.name as string) ?? formData.calculationMethod}</p>
                <p><strong>Activity:</strong> {formData.activityValue} x {formData.factorType} ({formData.category})</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Calculation History</h2>
        {calculationsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-full rounded bg-[rgb(var(--muted))] animate-pulse" />
            ))}
          </div>
        ) : calculationsQuery.isError ? (
          <p className="text-sm text-red-500">Failed to load calculation history.</p>
        ) : calculationsQuery.data?.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">No calculation history yet.</p>
        ) : calculationsQuery.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[rgb(var(--muted))]">
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Result (CO2e)</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculationsQuery.data.map((c: any) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2">{c.calculationType}</td>
                    <td className="py-2 font-medium">{c.resultCo2e} tCO2e</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{c.methodology ?? '-'}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteCalculation(c.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Delete calculation ${c.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
