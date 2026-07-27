import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import type { ScenarioSimulation, ScenarioSimulationInput } from '../types.js';

interface ScenarioRow {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  scenarioType: string;
  parameters: Record<string, unknown>;
  projectedComplianceScore: string | null;
  projectedAuditReadiness: string | null;
  projectedViolations: string | null;
  projectedImprovement: string | null;
  results: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: ScenarioRow): ScenarioSimulation {
  return {
    id: row.id, organizationId: row.organizationId, name: row.name, description: row.description ?? undefined,
    scenarioType: row.scenarioType as ScenarioSimulation['scenarioType'], parameters: row.parameters ?? {}, results: row.results ?? {},
    projectedComplianceScore: row.projectedComplianceScore ? parseFloat(row.projectedComplianceScore) : undefined,
    projectedAuditReadiness: row.projectedAuditReadiness ? parseFloat(row.projectedAuditReadiness) : undefined,
    projectedViolations: row.projectedViolations ? parseInt(row.projectedViolations, 10) : undefined,
    projectedImprovement: row.projectedImprovement ? parseFloat(row.projectedImprovement) : undefined,
    createdBy: row.createdBy ? row.createdBy : undefined, createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}

function simulateImpact(params: Record<string, unknown>, baseline: { complianceScore: number; auditReadiness: number; violations: number }): {
  projectedComplianceScore: number; projectedAuditReadiness: number; projectedViolations: number; projectedImprovement: number;
} {
  const improvementFactor = (params.improvementPercent as number ?? 0) / 100;
  const responseTimeDrop = (params.responseTimeDropPercent as number ?? 0) / 100;
  const supplierRiskIncrease = (params.supplierRiskIncrease as number ?? 0) / 100;
  const projectedComplianceScore = Math.min(100, baseline.complianceScore + (improvementFactor * 20) + (responseTimeDrop * 10) - (supplierRiskIncrease * 15));
  const projectedAuditReadiness = Math.min(100, baseline.auditReadiness + (improvementFactor * 15) + (responseTimeDrop * 8));
  const projectedViolations = Math.max(0, Math.round(baseline.violations * (1 - improvementFactor * 0.3 - responseTimeDrop * 0.2 + supplierRiskIncrease * 0.4)));
  const projectedImprovement = projectedComplianceScore - baseline.complianceScore;
  return { projectedComplianceScore: Math.round(projectedComplianceScore * 100) / 100, projectedAuditReadiness: Math.round(projectedAuditReadiness * 100) / 100, projectedViolations, projectedImprovement: Math.round(projectedImprovement * 100) / 100 };
}

export const scenarioEngineService = {
  async runSimulation(input: ScenarioSimulationInput): Promise<ScenarioSimulation> {
    const baseline = { complianceScore: 72, auditReadiness: 65, violations: 12 };
    const result = simulateImpact(input.parameters, baseline);
    const record = {
      id: randomUUID(), organizationId: input.organizationId, name: input.name, description: input.description ?? null,
      scenarioType: input.scenarioType, parameters: input.parameters, results: result, ...result,
      createdBy: input.createdBy ?? null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const { rows } = await query<ScenarioRow>(
      `INSERT INTO scenario_simulations (id, organization_id, name, description, scenario_type, parameters, projected_compliance_score, projected_audit_readiness, projected_violations, projected_improvement, results, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [record.id, record.organizationId, record.name, record.description, record.scenarioType, JSON.stringify(record.parameters), record.projectedComplianceScore, record.projectedAuditReadiness, record.projectedViolations, record.projectedImprovement, JSON.stringify(record.results), record.createdBy, record.createdAt, record.updatedAt],
    );
    await audit({ organizationId: input.organizationId, actorId: input.createdBy ?? null, action: 'scenario.run', entity: 'scenario_simulation', entityId: record.id, metadata: { type: input.scenarioType } });
    return mapRow(rows[0]);
  },

  async list(organizationId: string): Promise<ScenarioSimulation[]> {
    const { rows } = await query<ScenarioRow>(`SELECT * FROM scenario_simulations WHERE organization_id = $1 ORDER BY created_at DESC LIMIT 50`, [organizationId]);
    return rows.map(mapRow);
  },

  async findById(id: string): Promise<ScenarioSimulation | null> {
    const { rows } = await query<ScenarioRow>(`SELECT * FROM scenario_simulations WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  },
};
