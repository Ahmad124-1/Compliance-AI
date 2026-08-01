import { query } from '../db/pool.js';

export interface WaterTarget {
  id: string;
  organizationId: string;
  facilityId: string | null;
  departmentId: string | null;
  name: string;
  description: string | null;
  targetType: 'reduction' | 'intensity' | 'reuse' | 'recycling' | 'discharge_quality' | 'other';
  baselineValue: number;
  targetValue: number;
  currentValue: number | null;
  unit: string;
  baselineYear: number;
  targetYear: number;
  progressPct: number;
  status: 'active' | 'achieved' | 'missed' | 'paused' | 'archived';
  ownerId: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapWaterTarget(row: any): WaterTarget {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    departmentId: row.department_id,
    name: row.name,
    description: row.description,
    targetType: row.target_type,
    baselineValue: Number(row.baseline_value),
    targetValue: Number(row.target_value),
    currentValue: row.current_value ? Number(row.current_value) : null,
    unit: row.unit,
    baselineYear: row.baseline_year,
    targetYear: row.target_year,
    progressPct: Number(row.progress_pct),
    status: row.status,
    ownerId: row.owner_id,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface WaterTargetFilter {
  facilityId?: string;
  departmentId?: string;
  targetType?: string;
  status?: string;
}

export const waterTargetRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    departmentId?: string | null;
    name: string;
    description?: string | null;
    targetType: string;
    baselineValue: number;
    targetValue: number;
    currentValue?: number | null;
    unit?: string;
    baselineYear: number;
    targetYear: number;
    progressPct?: number;
    status?: string;
    ownerId?: string | null;
    notes?: string | null;
  }): Promise<WaterTarget> {
    const { rows } = await query<WaterTarget>(
      `INSERT INTO water_targets (organization_id, facility_id, department_id, name, description, target_type, baseline_value, target_value, current_value, unit, baseline_year, target_year, progress_pct, status, owner_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.departmentId ?? null,
        input.name,
        input.description ?? null,
        input.targetType,
        input.baselineValue,
        input.targetValue,
        input.currentValue ?? null,
        input.unit ?? 'm3',
        input.baselineYear,
        input.targetYear,
        input.progressPct ?? 0,
        input.status ?? 'active',
        input.ownerId ?? null,
        input.notes ?? null,
      ],
    );
    return mapWaterTarget(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<WaterTarget | null> {
    const { rows } = await query<WaterTarget>(
      `SELECT * FROM water_targets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapWaterTarget(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: WaterTargetFilter = {}): Promise<WaterTarget[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.departmentId) { where.push(`department_id = $${i++}`); params.push(filter.departmentId); }
    if (filter.targetType) { where.push(`target_type = $${i++}`); params.push(filter.targetType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    const { rows } = await query<WaterTarget>(
      `SELECT * FROM water_targets WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapWaterTarget);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<WaterTarget, 'name' | 'description' | 'targetType' | 'baselineValue' | 'targetValue' | 'currentValue' | 'unit' | 'baselineYear' | 'targetYear' | 'progressPct' | 'status' | 'ownerId' | 'notes'>>): Promise<WaterTarget | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.targetType !== undefined) set('target_type', patch.targetType);
    if (patch.baselineValue !== undefined) set('baseline_value', patch.baselineValue);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.currentValue !== undefined) set('current_value', patch.currentValue);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.baselineYear !== undefined) set('baseline_year', patch.baselineYear);
    if (patch.targetYear !== undefined) set('target_year', patch.targetYear);
    if (patch.progressPct !== undefined) set('progress_pct', patch.progressPct);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<WaterTarget>(
      `UPDATE water_targets SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapWaterTarget(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE water_targets SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

