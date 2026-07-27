'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card.js';
import { useRunScenario, useScenarios } from '@/modules/predictive/hooks.js';

const SCENARIO_TYPES = [
  { value: 'capa_improvement', label: 'CAPA Improvement' },
  { value: 'response_time', label: 'Response Time Drop' },
  { value: 'supplier_risk', label: 'Supplier Risk Increase' },
  { value: 'training_impact', label: 'Training Impact' },
  { value: 'audit_readiness', label: 'Audit Readiness' },
] as const;

export default function ScenarioSimulatorPage() {
  const [name, setName] = useState('');
  const [scenarioType, setScenarioType] = useState<string>('capa_improvement');
  const [improvementPercent, setImprovementPercent] = useState(20);
  const [responseTimeDrop, setResponseTimeDrop] = useState(10);
  const [supplierRiskIncrease, setSupplierRiskIncrease] = useState(0);
  const { data: scenarios, isLoading } = useScenarios();
  const runMutation = useRunScenario();

  async function runSimulation() {
    const params: Record<string, unknown> = { improvementPercent, responseTimeDropPercent: responseTimeDrop, supplierRiskIncrease };
    await runMutation.mutateAsync({ name: name || 'Untitled Scenario', description: '', scenarioType: scenarioType as any, parameters: params });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scenario Simulator</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Run what-if simulations to see projected impact on compliance score, audit readiness and violations.</p>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">New Simulation</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium">Scenario Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1.5 text-sm" placeholder="e.g. Q3 CAPA push" />
          </div>
          <div>
            <label className="block text-xs font-medium">Type</label>
            <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1.5 text-sm">
              {SCENARIO_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium">CAPA Improvement %</label>
            <input type="number" value={improvementPercent} onChange={(e) => setImprovementPercent(Number(e.target.value))} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium">Response Time Drop %</label>
            <input type="number" value={responseTimeDrop} onChange={(e) => setResponseTimeDrop(Number(e.target.value))} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium">Supplier Risk Increase %</label>
            <input type="number" value={supplierRiskIncrease} onChange={(e) => setSupplierRiskIncrease(Number(e.target.value))} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={runSimulation} disabled={runMutation.isPending} className="rounded-md bg-[rgb(var(--primary))] px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Run Simulation</button>
        </div>
      </Card>

      {runMutation.isSuccess && (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Last Result</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-xs text-[rgb(var(--muted))]">Projected Compliance</p><p className="text-lg font-semibold">{runMutation.data?.projectedComplianceScore ?? '—'}</p></div>
            <div><p className="text-xs text-[rgb(var(--muted))]">Projected Readiness</p><p className="text-lg font-semibold">{runMutation.data?.projectedAuditReadiness ?? '—'}</p></div>
            <div><p className="text-xs text-[rgb(var(--muted))]">Projected Violations</p><p className="text-lg font-semibold">{runMutation.data?.projectedViolations ?? '—'}</p></div>
            <div><p className="text-xs text-[rgb(var(--muted))]">Projected Improvement</p><p className="text-lg font-semibold">{runMutation.data?.projectedImprovement ?? '—'}</p></div>
          </div>
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Recent Simulations</h2>
        {isLoading ? (
          <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">Loading…</p></Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(scenarios ?? []).map((s) => (
              <Card key={s.id} className="p-4">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{s.scenarioType}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[rgb(var(--muted))]">Compliance:</span> {s.projectedComplianceScore}</div>
                  <div><span className="text-[rgb(var(--muted))]">Readiness:</span> {s.projectedAuditReadiness}</div>
                  <div><span className="text-[rgb(var(--muted))]">Violations:</span> {s.projectedViolations}</div>
                  <div><span className="text-[rgb(var(--muted))]">Improvement:</span> {s.projectedImprovement}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
