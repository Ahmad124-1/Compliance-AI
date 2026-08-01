import { query } from '../db/pool.js';

export interface AirEmissionLimit {
  id: string;
  organizationId: string;
  facilityId: string | null;
  permitId: string | null;
  emissionType: string;
  limitValue: number;
  limitUnit: string;
  monitoringFrequency: string;
  maxConcentration: number | null;
  concentrationUnit: string;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapAirEmissionLimit(row: any): AirEmissionLimit {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    permitId: row.permit_id,
    emissionType: row.emission_type,
    limitValue: Number(row.limit_value),
    limitUnit: row.limit_unit,
    monitoringFrequency: row.monitoring_frequency,
    maxConcentration: row.max_concentration ? Number(row.max_concentration) : null,
    concentrationUnit: row.concentration_unit || 'mg/m3',
    effectiveDate: row.effective_date,
    expiryDate: row.expiry_date,
    isActive: row.is_active,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AirEmissionLimitFilter {
  facilityId?: string;
  permitId?: string;
  emissionType?: string;
  isActive?: boolean;
}

export const airEmissionLimitRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    permitId?: string | null;
    emissionType: string;
    limitValue: number;
    limitUnit?: string;
    monitoringFrequency?: string;
    maxConcentration?: number | null;
    concentrationUnit?: string;
    effectiveDate: string;
    expiryDate?: string | null;
    isActive?: boolean;
    notes?: string | null;
  }): Promise<AirEmissionLimit> {
    const { rows } = await query<AirEmissionLimit>(
      `INSERT INTO air_emission_limits (organization_id, facility_id, permit_id, emission_type, limit_value, limit_unit, monitoring_frequency, max_concentration, concentration_unit, effective_date, expiry_date, is_active, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.permitId ?? null,
        input.emissionType,
        input.limitValue,
        input.limitUnit ?? 'kg/year',
        input.monitoringFrequency ?? 'monthly',
        input.maxConcentration ?? null,
        input.concentrationUnit ?? 'mg/m3',
        input.effectiveDate,
        input.expiryDate ?? null,
        input.isActive ?? true,
        input.notes ?? null,
      ],
    );
    return mapAirEmissionLimit(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<AirEmissionLimit | null> {
    const { rows } = await query<AirEmissionLimit>(
      `SELECT * FROM air_emission_limits WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapAirEmissionLimit(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: AirEmissionLimitFilter = {}): Promise<AirEmissionLimit[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.permitId) { where.push(`permit_id = $${i++}`); params.push(filter.permitId); }
    if (filter.emissionType) { where.push(`emission_type = $${i++}`); params.push(filter.emissionType); }
    if (filter.isActive !== undefined) { where.push(`is_active = $${i++}`); params.push(filter.isActive); }
    const { rows } = await query<AirEmissionLimit>(
      `SELECT * FROM air_emission_limits WHERE ${where.join(' AND ')} ORDER BY effective_date DESC`,
      params,
    );
    return rows.map(mapAirEmissionLimit);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<AirEmissionLimit, 'emissionType' | 'limitValue' | 'limitUnit' | 'monitoringFrequency' | 'maxConcentration' | 'concentrationUnit' | 'effectiveDate' | 'expiryDate' | 'isActive' | 'notes'>>): Promise<AirEmissionLimit | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.emissionType !== undefined) set('emission_type', patch.emissionType);
    if (patch.limitValue !== undefined) set('limit_value', patch.limitValue);
    if (patch.limitUnit !== undefined) set('limit_unit', patch.limitUnit);
    if (patch.monitoringFrequency !== undefined) set('monitoring_frequency', patch.monitoringFrequency);
    if (patch.maxConcentration !== undefined) set('max_concentration', patch.maxConcentration);
    if (patch.concentrationUnit !== undefined) set('concentration_unit', patch.concentrationUnit);
    if (patch.effectiveDate !== undefined) set('effective_date', patch.effectiveDate);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<AirEmissionLimit>(
      `UPDATE air_emission_limits SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapAirEmissionLimit(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE air_emission_limits SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

