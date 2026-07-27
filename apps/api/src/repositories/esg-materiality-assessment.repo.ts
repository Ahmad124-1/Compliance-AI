import { query } from '../db/pool.js';
import type { EsgMaterialityAssessment } from '../types/esg.js';

function mapAssessment(row: any): EsgMaterialityAssessment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    topicId: row.topic_id,
    periodId: row.period_id,
    impactScore: parseFloat(row.impact_score),
    likelihoodScore: parseFloat(row.likelihood_score),
    stakeholderPriority: row.stakeholder_priority ? parseFloat(row.stakeholder_priority) : null,
    financialMateriality: row.financial_materiality,
    impactMateriality: row.impact_materiality,
    overallPriorityScore: row.overall_priority_score ? parseFloat(row.overall_priority_score) : null,
    justification: row.justification,
    assessedBy: row.assessed_by,
    approved: row.approved,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AssessmentFilter {
  periodId?: string;
  topicId?: string;
  approved?: boolean;
}

export const esgMaterialityAssessmentRepo = {
  async create(input: {
    organizationId: string;
    topicId: string;
    periodId: string;
    impactScore: number;
    likelihoodScore: number;
    stakeholderPriority?: number;
    financialMateriality?: boolean;
    impactMateriality?: boolean;
    overallPriorityScore?: number;
    justification?: string;
    assessedBy?: string;
  }): Promise<EsgMaterialityAssessment> {
    const { rows } = await query<EsgMaterialityAssessment>(
      `INSERT INTO esg_materiality_assessments (organization_id, topic_id, period_id, impact_score, likelihood_score, stakeholder_priority, financial_materiality, impact_materiality, overall_priority_score, justification, assessed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.topicId,
        input.periodId,
        input.impactScore,
        input.likelihoodScore,
        input.stakeholderPriority ?? null,
        input.financialMateriality ?? false,
        input.impactMateriality ?? false,
        input.overallPriorityScore ?? null,
        input.justification ?? null,
        input.assessedBy ?? null,
      ],
    );
    return mapAssessment(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgMaterialityAssessment | null> {
    const { rows } = await query<EsgMaterialityAssessment>(
      `SELECT * FROM esg_materiality_assessments WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapAssessment(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: AssessmentFilter = {}): Promise<EsgMaterialityAssessment[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.periodId) {
      where.push(`period_id = $${i++}`);
      params.push(filter.periodId);
    }
    if (filter.topicId) {
      where.push(`topic_id = $${i++}`);
      params.push(filter.topicId);
    }
    if (filter.approved !== undefined) {
      where.push(`approved = $${i++}`);
      params.push(filter.approved);
    }
    const { rows } = await query<EsgMaterialityAssessment>(
      `SELECT * FROM esg_materiality_assessments WHERE ${where.join(' AND ')} ORDER BY overall_priority_score DESC NULLS LAST, created_at DESC`,
      params,
    );
    return rows.map(mapAssessment);
  },

  async listByPeriod(periodId: string, orgId: string): Promise<EsgMaterialityAssessment[]> {
    const { rows } = await query<EsgMaterialityAssessment>(
      `SELECT * FROM esg_materiality_assessments WHERE period_id = $1 AND organization_id = $2 AND is_deleted = FALSE ORDER BY overall_priority_score DESC NULLS LAST`,
      [periodId, orgId],
    );
    return rows.map(mapAssessment);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgMaterialityAssessment, 'impactScore' | 'likelihoodScore' | 'stakeholderPriority' | 'financialMateriality' | 'impactMateriality' | 'overallPriorityScore' | 'justification' | 'approved' | 'approvedBy' | 'approvedAt'>>): Promise<EsgMaterialityAssessment | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.impactScore !== undefined) set('impact_score', patch.impactScore);
    if (patch.likelihoodScore !== undefined) set('likelihood_score', patch.likelihoodScore);
    if (patch.stakeholderPriority !== undefined) set('stakeholder_priority', patch.stakeholderPriority);
    if (patch.financialMateriality !== undefined) set('financial_materiality', patch.financialMateriality);
    if (patch.impactMateriality !== undefined) set('impact_materiality', patch.impactMateriality);
    if (patch.overallPriorityScore !== undefined) set('overall_priority_score', patch.overallPriorityScore);
    if (patch.justification !== undefined) set('justification', patch.justification);
    if (patch.approved !== undefined) set('approved', patch.approved);
    if (patch.approvedBy !== undefined) set('approved_by', patch.approvedBy);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgMaterialityAssessment>(
      `UPDATE esg_materiality_assessments SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapAssessment(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_materiality_assessments SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
