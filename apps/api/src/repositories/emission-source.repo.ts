import { query } from '../db/pool.js';
import type { EmissionSource, EmissionSourceCategory, EmissionSourceType } from '../types/carbon.js';

function mapEmissionSource(row: any): EmissionSource {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    name: row.name,
    description: row.description,
    sourceCategory: row.source_category,
    sourceType: row.source_type,
    scopeId: row.scope_id,
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EmissionSourceFilter {
  facilityId?: string;
  sourceCategory?: EmissionSourceCategory;
  sourceType?: EmissionSourceType;
}

export const emissionSourceRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string;
    name: string;
    description?: string;
    sourceCategory: EmissionSourceCategory;
    sourceType: EmissionSourceType;
    scopeId?: string;
    isActive?: boolean;
  }): Promise<EmissionSource> {
    const { rows } = await query<EmissionSource>(
      `INSERT INTO emission_sources (organization_id, facility_id, name, description, source_category, source_type, scope_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.name,
        input.description ?? null,
        input.sourceCategory,
        input.sourceType,
        input.scopeId ?? null,
        input.isActive ?? true,
      ],
    );
    return mapEmissionSource(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EmissionSource | null> {
    const { rows } = await query<EmissionSource>(
      `SELECT * FROM emission_sources WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEmissionSource(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EmissionSourceFilter = {}): Promise<EmissionSource[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    if (filter.sourceCategory) {
      where.push(`source_category = $${i++}`);
      params.push(filter.sourceCategory);
    }
    if (filter.sourceType) {
      where.push(`source_type = $${i++}`);
      params.push(filter.sourceType);
    }
    const { rows } = await query<EmissionSource>(
      `SELECT * FROM emission_sources WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEmissionSource);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EmissionSource, 'facilityId' | 'name' | 'description' | 'sourceCategory' | 'sourceType' | 'scopeId' | 'isActive'>>): Promise<EmissionSource | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.sourceCategory !== undefined) set('source_category', patch.sourceCategory);
    if (patch.sourceType !== undefined) set('source_type', patch.sourceType);
    if (patch.scopeId !== undefined) set('scope_id', patch.scopeId);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EmissionSource>(
      `UPDATE emission_sources SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEmissionSource(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE emission_sources SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
