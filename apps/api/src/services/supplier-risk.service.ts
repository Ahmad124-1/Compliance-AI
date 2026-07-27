import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierRiskRecord, SupplierRiskHeatmapData, SupplierRiskAssessmentSummary } from '../modules/supplier-risk/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

function calculateRiskScore(likelihood: string, impact: string): number {
  const lMap: Record<string, number> = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
  const iMap: Record<string, number> = { negligible: 1, minor: 2, moderate: 3, major: 4, severe: 5 };
  return (lMap[likelihood] ?? 1) * (iMap[impact] ?? 1);
}

export const supplierRiskService = {
  async createRisk(organizationId: string, supplierId: string, input: Partial<SupplierRiskRecord> & { riskType: string; title: string; likelihood: string; impact: string }, actorId?: string | null): Promise<SupplierRiskRecord> {
    const riskScore = calculateRiskScore(input.likelihood, input.impact);
    const record: SupplierRiskRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      riskType: input.riskType as any,
      title: input.title,
      description: input.description ?? null,
      likelihood: input.likelihood as any,
      impact: input.impact as any,
      riskScore,
      mitigationPlan: input.mitigationPlan ?? null,
      ownerId: input.ownerId ?? null,
      ownerName: input.ownerName ?? null,
      reviewSchedule: input.reviewSchedule ?? null,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO supplier_risks (id, organization_id, supplier_id, risk_type, title, description, likelihood, impact, risk_score, mitigation_plan, owner_id, owner_name, review_schedule, status, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [record.id, record.organizationId, record.supplierId, record.riskType, record.title, record.description, record.likelihood, record.impact, record.riskScore, record.mitigationPlan, record.ownerId, record.ownerName, record.reviewSchedule, record.status, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_risk.create', entity: 'supplier_risk', entityId: record.id });
    return record;
  },

  async listRisks(organizationId: string, supplierId?: string, filters?: { riskType?: string; status?: string; severity?: string }): Promise<SupplierRiskRecord[]> {
    let sql = `SELECT * FROM supplier_risks WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    let idx = 2;
    if (supplierId) { sql += ` AND supplier_id = $${idx++}`; params.push(supplierId); }
    if (filters?.riskType) { sql += ` AND risk_type = $${idx++}`; params.push(filters.riskType); }
    if (filters?.status) { sql += ` AND status = $${idx++}`; params.push(filters.status); }
    if (filters?.severity) { sql += ` AND impact = $${idx++}`; params.push(filters.severity); }
    sql += ` ORDER BY risk_score DESC, created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierRiskRecord>);
  },

  async getRisk(id: string, organizationId: string): Promise<SupplierRiskRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_risks WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Risk not found');
    return mapRow<SupplierRiskRecord>(rows[0]);
  },

  async updateRisk(id: string, organizationId: string, input: Partial<SupplierRiskRecord>, actorId?: string | null): Promise<SupplierRiskRecord> {
    const existing = await this.getRisk(id, organizationId);
    const updated: SupplierRiskRecord = { ...existing, ...input, id, organizationId, riskScore: input.riskScore ?? calculateRiskScore(input.likelihood ?? existing.likelihood, input.impact ?? existing.impact), updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_risks SET title=$2, description=$3, likelihood=$4, impact=$5, risk_score=$6, mitigation_plan=$7, owner_id=$8, owner_name=$9, review_schedule=$10, status=$11, updated_at=NOW() WHERE id=$1`, [id, updated.title, updated.description, updated.likelihood, updated.impact, updated.riskScore, updated.mitigationPlan, updated.ownerId, updated.ownerName, updated.reviewSchedule, updated.status]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_risk.update', entity: 'supplier_risk', entityId: id });
    return updated;
  },

  async closeRisk(id: string, organizationId: string, actorId?: string | null): Promise<SupplierRiskRecord> {
    const existing = await this.getRisk(id, organizationId);
    const updated = { ...existing, status: 'closed' as const, updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_risks SET status='closed', updated_at=NOW() WHERE id=$1`, [id]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_risk.close', entity: 'supplier_risk', entityId: id });
    return updated;
  },

  async getRiskHeatmap(organizationId: string): Promise<{ total: number; byType: Record<string, number>; byLikelihood: Record<string, number>; byImpact: Record<string, number>; highRisks: SupplierRiskRecord[] }> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_risks WHERE organization_id = $1 AND is_deleted = FALSE AND risk_score >= 12`, [organizationId]);
    const byType: Record<string, number> = {};
    const byLikelihood: Record<string, number> = {};
    const byImpact: Record<string, number> = {};
    for (const r of rows) {
      byType[r.risk_type] = (byType[r.risk_type] ?? 0) + 1;
      byLikelihood[r.likelihood] = (byLikelihood[r.likelihood] ?? 0) + 1;
      byImpact[r.impact] = (byImpact[r.impact] ?? 0) + 1;
    }
    return { total: rows.length, byType, byLikelihood, byImpact, highRisks: rows.map(mapRow<SupplierRiskRecord>) };
  },
};