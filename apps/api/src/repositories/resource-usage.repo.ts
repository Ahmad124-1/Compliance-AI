import { query } from '../db/pool.js';
import type { ResourceUsage, ResourceType } from '../types/environment.js';

function mapResourceUsage(row: any): ResourceUsage {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    departmentId: row.department_id,
    resourceType: row.resource_type,
    consumptionAmount: Number(row.consumption_amount),
    unit: row.unit,
    cost: row.cost ? Number(row.cost) : null,
    consumptionDate: row.consumption_date,
    reportingPeriod: row.reporting_period,
    efficiencyRating: row.efficiency_rating ? Number(row.efficiency_rating) : null,
    intensityMetric: row.intensity_metric ? Number(row.intensity_metric) : null,
    recordedBy: row.recorded_by,
    isVerified: row.is_verified,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ResourceUsageFilter {
  facilityId?: string;
  siteId?: string;
  departmentId?: string;
  resourceType?: ResourceType;
  reportingPeriod?: string;
  startDate?: string;
  endDate?: string;
}

export const resourceUsageRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    departmentId?: string | null;
    resourceType: ResourceType;
    consumptionAmount: number;
    unit: string;
    cost?: number | null;
    consumptionDate: string;
    reportingPeriod: string;
    efficiencyRating?: number | null;
    intensityMetric?: number | null;
    recordedBy?: string | null;
    notes?: string | null;
  }): Promise<ResourceUsage> {
    const { rows } = await query<ResourceUsage>(
      `INSERT INTO resource_usage (organization_id, facility_id, site_id, department_id, resource_type, consumption_amount, unit, cost, consumption_date, reporting_period, efficiency_rating, intensity_metric, recorded_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.resourceType,
        input.consumptionAmount,
        input.unit,
        input.cost ?? null,
        input.consumptionDate,
        input.reportingPeriod,
        input.efficiencyRating ?? null,
        input.intensityMetric ?? null,
        input.recordedBy ?? null,
        input.notes ?? null,
      ],
    );
    return mapResourceUsage(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<ResourceUsage | null> {
    const { rows } = await query<ResourceUsage>(
      `SELECT * FROM resource_usage WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapResourceUsage(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ResourceUsageFilter = {}): Promise<ResourceUsage[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.departmentId) { where.push(`department_id = $${i++}`); params.push(filter.departmentId); }
    if (filter.resourceType) { where.push(`resource_type = $${i++}`); params.push(filter.resourceType); }
    if (filter.reportingPeriod) { where.push(`reporting_period = $${i++}`); params.push(filter.reportingPeriod); }
    if (filter.startDate) { where.push(`consumption_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`consumption_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<ResourceUsage>(
      `SELECT * FROM resource_usage WHERE ${where.join(' AND ')} ORDER BY consumption_date DESC`,
      params,
    );
    return rows.map(mapResourceUsage);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<ResourceUsage, 'resourceType' | 'consumptionAmount' | 'unit' | 'cost' | 'consumptionDate' | 'reportingPeriod' | 'efficiencyRating' | 'intensityMetric' | 'isVerified' | 'notes'>>): Promise<ResourceUsage | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.resourceType !== undefined) set('resource_type', patch.resourceType);
    if (patch.consumptionAmount !== undefined) set('consumption_amount', patch.consumptionAmount);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.cost !== undefined) set('cost', patch.cost);
    if (patch.consumptionDate !== undefined) set('consumption_date', patch.consumptionDate);
    if (patch.reportingPeriod !== undefined) set('reporting_period', patch.reportingPeriod);
    if (patch.efficiencyRating !== undefined) set('efficiency_rating', patch.efficiencyRating);
    if (patch.intensityMetric !== undefined) set('intensity_metric', patch.intensityMetric);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<ResourceUsage>(
      `UPDATE resource_usage SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapResourceUsage(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE resource_usage SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
