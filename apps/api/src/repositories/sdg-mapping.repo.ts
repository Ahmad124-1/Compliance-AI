import { query } from '../db/pool.js';
import type { SdgMapping } from '../types/sustainability.js';

function mapSdg(row: any): SdgMapping {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sdgId: parseInt(row.sdg_id, 10),
    entityType: row.entity_type,
    entityId: row.entity_id,
    contributionPct: parseFloat(row.contribution_pct) ?? 100,
    description: row.description,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
  };
}

export interface SdgMappingFilter {
  entityType?: string;
  entityId?: string;
  sdgId?: number;
}

export const sdgMappingRepo = {
  async create(input: {
    organizationId: string;
    sdgId: number;
    entityType: string;
    entityId: string;
    contributionPct?: number;
    description?: string;
  }): Promise<SdgMapping> {
    const { rows } = await query<SdgMapping>(
      `INSERT INTO sdg_mappings (organization_id, sdg_id, entity_type, entity_id, contribution_pct, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (sdg_id, entity_type, entity_id, organization_id) DO UPDATE SET
         contribution_pct = EXCLUDED.contribution_pct,
         description = EXCLUDED.description,
         is_deleted = FALSE,
         updated_at = now()
       RETURNING *`,
      [
        input.organizationId,
        input.sdgId,
        input.entityType,
        input.entityId,
        input.contributionPct ?? 100,
        input.description ?? null,
      ],
    );
    return mapSdg(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SdgMapping | null> {
    const { rows } = await query<SdgMapping>(
      `SELECT * FROM sdg_mappings WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapSdg(rows[0]) : null;
  },

  async listByEntity(entityType: string, entityId: string, orgId: string): Promise<SdgMapping[]> {
    const { rows } = await query<SdgMapping>(
      `SELECT * FROM sdg_mappings WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3 AND is_deleted = FALSE`,
      [entityType, entityId, orgId],
    );
    return rows.map(mapSdg);
  },

  async listByOrganization(orgId: string, filter: SdgMappingFilter = {}): Promise<SdgMapping[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.entityType) {
      where.push(`entity_type = $${i++}`);
      params.push(filter.entityType);
    }
    if (filter.entityId) {
      where.push(`entity_id = $${i++}`);
      params.push(filter.entityId);
    }
    if (filter.sdgId) {
      where.push(`sdg_id = $${i++}`);
      params.push(filter.sdgId);
    }
    const { rows } = await query<SdgMapping>(
      `SELECT * FROM sdg_mappings WHERE ${where.join(' AND ')} ORDER BY sdg_id`,
      params,
    );
    return rows.map(mapSdg);
  },

  async getSdgContribution(orgId: string): Promise<Record<number, number>> {
    const { rows } = await query<{ sdg_id: string; total_contribution: string }>(
      `SELECT sdg_id, SUM(contribution_pct) AS total_contribution
       FROM sdg_mappings
       WHERE organization_id = $1 AND is_deleted = FALSE
       GROUP BY sdg_id`,
      [orgId],
    );
    const result: Record<number, number> = {};
    for (const r of rows) {
      result[parseInt(r.sdg_id, 10)] = parseFloat(r.total_contribution);
    }
    return result;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sdg_mappings SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

