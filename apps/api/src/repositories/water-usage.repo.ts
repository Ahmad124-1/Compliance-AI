import { query } from '../db/pool.js';
import type { WaterUsage, WaterSourceType } from '../types/environment.js';

function mapWaterUsage(row: any): WaterUsage {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    departmentId: row.department_id,
    sourceType: row.source_type,
    consumptionDate: row.consumption_date,
    consumptionAmount: Number(row.consumption_amount),
    unit: row.unit,
    dischargeAmount: row.discharge_amount ? Number(row.discharge_amount) : null,
    dischargeQuality: row.discharge_quality,
    treatmentMethod: row.treatment_method,
    reuseAmount: Number(row.reuse_amount),
    leakDetected: row.leak_detected,
    leakDetails: row.leak_details,
    waterIntensity: row.water_intensity ? Number(row.water_intensity) : null,
    cost: row.cost ? Number(row.cost) : null,
    recordedBy: row.recorded_by,
    isVerified: row.is_verified,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface WaterUsageFilter {
  facilityId?: string;
  siteId?: string;
  sourceType?: WaterSourceType;
  startDate?: string;
  endDate?: string;
}

export const waterUsageRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    departmentId?: string | null;
    sourceType: WaterSourceType;
    consumptionDate: string;
    consumptionAmount: number;
    unit?: string;
    dischargeAmount?: number | null;
    dischargeQuality?: string | null;
    treatmentMethod?: string | null;
    reuseAmount?: number;
    leakDetected?: boolean;
    leakDetails?: string | null;
    waterIntensity?: number | null;
    cost?: number | null;
    recordedBy?: string | null;
    notes?: string | null;
  }): Promise<WaterUsage> {
    const { rows } = await query<WaterUsage>(
      `INSERT INTO water_usage (organization_id, facility_id, site_id, department_id, source_type, consumption_date, consumption_amount, unit, discharge_amount, discharge_quality, treatment_method, reuse_amount, leak_detected, leak_details, water_intensity, cost, recorded_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.sourceType,
        input.consumptionDate,
        input.consumptionAmount,
        input.unit ?? 'm3',
        input.dischargeAmount ?? null,
        input.dischargeQuality ?? null,
        input.treatmentMethod ?? null,
        input.reuseAmount ?? 0,
        input.leakDetected ?? false,
        input.leakDetails ?? null,
        input.waterIntensity ?? null,
        input.cost ?? null,
        input.recordedBy ?? null,
        input.notes ?? null,
      ],
    );
    return mapWaterUsage(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<WaterUsage | null> {
    const { rows } = await query<WaterUsage>(
      `SELECT * FROM water_usage WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapWaterUsage(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: WaterUsageFilter = {}): Promise<WaterUsage[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.sourceType) { where.push(`source_type = $${i++}`); params.push(filter.sourceType); }
    if (filter.startDate) { where.push(`consumption_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`consumption_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<WaterUsage>(
      `SELECT * FROM water_usage WHERE ${where.join(' AND ')} ORDER BY consumption_date DESC`,
      params,
    );
    return rows.map(mapWaterUsage);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<WaterUsage, 'sourceType' | 'consumptionDate' | 'consumptionAmount' | 'unit' | 'dischargeAmount' | 'dischargeQuality' | 'treatmentMethod' | 'reuseAmount' | 'leakDetected' | 'leakDetails' | 'waterIntensity' | 'cost' | 'isVerified' | 'notes'>>): Promise<WaterUsage | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.sourceType !== undefined) set('source_type', patch.sourceType);
    if (patch.consumptionDate !== undefined) set('consumption_date', patch.consumptionDate);
    if (patch.consumptionAmount !== undefined) set('consumption_amount', patch.consumptionAmount);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.dischargeAmount !== undefined) set('discharge_amount', patch.dischargeAmount);
    if (patch.dischargeQuality !== undefined) set('discharge_quality', patch.dischargeQuality);
    if (patch.treatmentMethod !== undefined) set('treatment_method', patch.treatmentMethod);
    if (patch.reuseAmount !== undefined) set('reuse_amount', patch.reuseAmount);
    if (patch.leakDetected !== undefined) set('leak_detected', patch.leakDetected);
    if (patch.leakDetails !== undefined) set('leak_details', patch.leakDetails);
    if (patch.waterIntensity !== undefined) set('water_intensity', patch.waterIntensity);
    if (patch.cost !== undefined) set('cost', patch.cost);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<WaterUsage>(
      `UPDATE water_usage SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapWaterUsage(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE water_usage SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
