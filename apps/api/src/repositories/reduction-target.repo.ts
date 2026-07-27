import { query } from '../db/pool.js';
import type { ReductionTarget, TargetType, TargetStatus } from '../types/carbon.js';

function mapReductionTarget(row: any): ReductionTarget {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    scopeId: row.scope_id,
    name: row.name,
    description: row.description,
    targetType: row.target_type,
    baselineEmissionsTco2e: parseFloat(row.baseline_emissions_tco2e),
    targetEmissionsTco2e: parseFloat(row.target_emissions_tco2e),
    baselineYear: parseInt(row.baseline_year, 10),
    targetYear: parseInt(row.target_year, 10),
    currentEmissionsTco2e: row.current_emissions_tco2e !== null ? parseFloat(row.current_emissions_tco2e) : null,
    progressPct: parseFloat(row.progress_pct),
    status: row.status,
    milestones: row.milestones ?? [],
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ReductionTargetFilter {
  targetType?: TargetType;
  status?: TargetStatus;
  facilityId?: string;
}

export const reductionTargetRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string;
    scopeId?: string;
    name: string;
    description?: string;
    targetType: TargetType;
    baselineEmissionsTco2e: number;
    targetEmissionsTco2e: number;
    baselineYear: number;
    targetYear: number;
    currentEmissionsTco2e?: number;
    progressPct?: number;
    status?: TargetStatus;
    milestones?: Record<string, unknown>[];
  }): Promise<ReductionTarget> {
    const { rows } = await query<ReductionTarget>(
      `INSERT INTO reduction_targets (organization_id, facility_id, scope_id, name, description, target_type, baseline_emissions_tco2e, target_emissions_tco2e, baseline_year, target_year, current_emissions_tco2e, progress_pct, status, milestones)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.scopeId ?? null,
        input.name,
        input.description ?? null,
        input.targetType,
        input.baselineEmissionsTco2e,
        input.targetEmissionsTco2e,
        input.baselineYear,
        input.targetYear,
        input.currentEmissionsTco2e ?? null,
        input.progressPct ?? 0,
        input.status ?? 'not_started',
        input.milestones ?? [],
      ],
    );
    return mapReductionTarget(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<ReductionTarget | null> {
    const { rows } = await query<ReductionTarget>(
      `SELECT * FROM reduction_targets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapReductionTarget(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ReductionTargetFilter = {}): Promise<ReductionTarget[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.targetType) {
      where.push(`target_type = $${i++}`);
      params.push(filter.targetType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    const { rows } = await query<ReductionTarget>(
      `SELECT * FROM reduction_targets WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapReductionTarget);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<ReductionTarget, 'facilityId' | 'scopeId' | 'name' | 'description' | 'targetType' | 'baselineEmissionsTco2e' | 'targetEmissionsTco2e' | 'baselineYear' | 'targetYear' | 'currentEmissionsTco2e' | 'progressPct' | 'status' | 'milestones'>>): Promise<ReductionTarget | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.scopeId !== undefined) set('scope_id', patch.scopeId);
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.targetType !== undefined) set('target_type', patch.targetType);
    if (patch.baselineEmissionsTco2e !== undefined) set('baseline_emissions_tco2e', patch.baselineEmissionsTco2e);
    if (patch.targetEmissionsTco2e !== undefined) set('target_emissions_tco2e', patch.targetEmissionsTco2e);
    if (patch.baselineYear !== undefined) set('baseline_year', patch.baselineYear);
    if (patch.targetYear !== undefined) set('target_year', patch.targetYear);
    if (patch.currentEmissionsTco2e !== undefined) set('current_emissions_tco2e', patch.currentEmissionsTco2e);
    if (patch.progressPct !== undefined) set('progress_pct', patch.progressPct);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.milestones !== undefined) set('milestones', patch.milestones);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<ReductionTarget>(
      `UPDATE reduction_targets SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapReductionTarget(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE reduction_targets SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
