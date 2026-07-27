import { query } from '../db/pool.js';
import type { EsgMaterialityTopic } from '../types/esg.js';

function mapTopic(row: any): EsgMaterialityTopic {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category,
    pillar: row.pillar,
    externalDrivers: row.external_drivers ?? [],
    internalDrivers: row.internal_drivers ?? [],
    stakeholderGroups: row.stakeholder_groups ?? [],
    impactScore: row.impact_score ? parseFloat(row.impact_score) : null,
    likelihoodScore: row.likelihood_score ? parseFloat(row.likelihood_score) : null,
    financialImpact: row.financial_impact,
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface MaterialityTopicFilter {
  pillar?: string;
  category?: string;
  financialImpact?: string;
}

export const esgMaterialityTopicRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    category: string;
    pillar: string;
    externalDrivers?: string[];
    internalDrivers?: string[];
    stakeholderGroups?: string[];
    impactScore?: number;
    likelihoodScore?: number;
    financialImpact?: string;
  }): Promise<EsgMaterialityTopic> {
    const { rows } = await query<EsgMaterialityTopic>(
      `INSERT INTO esg_materiality_topics (organization_id, name, description, category, pillar, external_drivers, internal_drivers, stakeholder_groups, impact_score, likelihood_score, financial_impact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.category,
        input.pillar,
        input.externalDrivers ?? [],
        input.internalDrivers ?? [],
        input.stakeholderGroups ?? [],
        input.impactScore ?? null,
        input.likelihoodScore ?? null,
        input.financialImpact ?? null,
      ],
    );
    return mapTopic(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgMaterialityTopic | null> {
    const { rows } = await query<EsgMaterialityTopic>(
      `SELECT * FROM esg_materiality_topics WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapTopic(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: MaterialityTopicFilter = {}): Promise<EsgMaterialityTopic[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.pillar) {
      where.push(`pillar = $${i++}`);
      params.push(filter.pillar);
    }
    if (filter.category) {
      where.push(`category = $${i++}`);
      params.push(filter.category);
    }
    if (filter.financialImpact) {
      where.push(`financial_impact = $${i++}`);
      params.push(filter.financialImpact);
    }
    const { rows } = await query<EsgMaterialityTopic>(
      `SELECT * FROM esg_materiality_topics WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapTopic);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgMaterialityTopic, 'name' | 'description' | 'impactScore' | 'likelihoodScore' | 'financialImpact' | 'isActive'>>): Promise<EsgMaterialityTopic | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.impactScore !== undefined) set('impact_score', patch.impactScore);
    if (patch.likelihoodScore !== undefined) set('likelihood_score', patch.likelihoodScore);
    if (patch.financialImpact !== undefined) set('financial_impact', patch.financialImpact);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgMaterialityTopic>(
      `UPDATE esg_materiality_topics SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapTopic(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_materiality_topics SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
