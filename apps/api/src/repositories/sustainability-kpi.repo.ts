import { query } from '../db/pool.js';
import type { SustainabilityKpi } from '../types/sustainability.js';

function mapKpi(row: any): SustainabilityKpi {
  return {
    id: row.id,
    organizationId: row.organization_id,
    programId: row.program_id,
    goalId: row.goal_id,
    initiativeId: row.initiative_id,
    name: row.name,
    description: row.description,
    kpiType: row.kpi_type,
    frequency: row.frequency,
    unit: row.unit,
    targetValue: row.target_value,
    baselineValue: row.baseline_value,
    thresholdWarning: row.threshold_warning,
    thresholdCritical: row.threshold_critical,
    aggregation: row.aggregation,
    departmentId: row.department_id,
    facilityId: row.facility_id,
    ownerId: row.owner_id,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface KpiFilter {
  search?: string;
  kpiType?: string;
  frequency?: string;
  programId?: string;
  goalId?: string;
  initiativeId?: string;
  departmentId?: string;
  ownerId?: string;
}

export const sustainabilityKpiRepo = {
  async create(input: {
    organizationId: string;
    programId?: string;
    goalId?: string;
    initiativeId?: string;
    name: string;
    description?: string;
    kpiType: string;
    frequency?: string;
    unit?: string;
    targetValue?: number;
    baselineValue?: number;
    thresholdWarning?: number;
    thresholdCritical?: number;
    aggregation?: string;
    departmentId?: string;
    facilityId?: string;
    ownerId?: string;
  }): Promise<SustainabilityKpi> {
    const { rows } = await query<SustainabilityKpi>(
      `INSERT INTO sustainability_kpis (organization_id, program_id, goal_id, initiative_id, name, description, kpi_type, frequency, unit, target_value, baseline_value, threshold_warning, threshold_critical, aggregation, department_id, facility_id, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        input.organizationId,
        input.programId ?? null,
        input.goalId ?? null,
        input.initiativeId ?? null,
        input.name,
        input.description ?? null,
        input.kpiType,
        input.frequency ?? 'monthly',
        input.unit ?? '',
        input.targetValue ?? null,
        input.baselineValue ?? null,
        input.thresholdWarning ?? null,
        input.thresholdCritical ?? null,
        input.aggregation ?? 'latest',
        input.departmentId ?? null,
        input.facilityId ?? null,
        input.ownerId ?? null,
      ],
    );
    return mapKpi(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityKpi | null> {
    const { rows } = await query<SustainabilityKpi>(
      `SELECT * FROM sustainability_kpis WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapKpi(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: KpiFilter = {}): Promise<SustainabilityKpi[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`name ILIKE $${i++}`);
      params.push(`%${filter.search}%`);
    }
    if (filter.kpiType) {
      where.push(`kpi_type = $${i++}`);
      params.push(filter.kpiType);
    }
    if (filter.frequency) {
      where.push(`frequency = $${i++}`);
      params.push(filter.frequency);
    }
    if (filter.programId) {
      where.push(`program_id = $${i++}`);
      params.push(filter.programId);
    }
    if (filter.goalId) {
      where.push(`goal_id = $${i++}`);
      params.push(filter.goalId);
    }
    if (filter.initiativeId) {
      where.push(`initiative_id = $${i++}`);
      params.push(filter.initiativeId);
    }
    if (filter.departmentId) {
      where.push(`department_id = $${i++}`);
      params.push(filter.departmentId);
    }
    if (filter.ownerId) {
      where.push(`owner_id = $${i++}`);
      params.push(filter.ownerId);
    }
    const { rows } = await query<SustainabilityKpi>(
      `SELECT * FROM sustainability_kpis WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapKpi);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SustainabilityKpi, 'name' | 'description' | 'kpiType' | 'frequency' | 'unit' | 'targetValue' | 'baselineValue' | 'thresholdWarning' | 'thresholdCritical' | 'aggregation' | 'departmentId' | 'facilityId' | 'ownerId'>>): Promise<SustainabilityKpi | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.kpiType !== undefined) set('kpi_type', patch.kpiType);
    if (patch.frequency !== undefined) set('frequency', patch.frequency);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.targetValue !== undefined) set('target_value', patch.targetValue);
    if (patch.baselineValue !== undefined) set('baseline_value', patch.baselineValue);
    if (patch.thresholdWarning !== undefined) set('threshold_warning', patch.thresholdWarning);
    if (patch.thresholdCritical !== undefined) set('threshold_critical', patch.thresholdCritical);
    if (patch.aggregation !== undefined) set('aggregation', patch.aggregation);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SustainabilityKpi>(
      `UPDATE sustainability_kpis SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapKpi(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_kpis SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

