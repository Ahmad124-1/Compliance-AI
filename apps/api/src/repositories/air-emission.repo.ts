import { query } from '../db/pool.js';
import type { AirEmission, AirEmissionType } from '../types/environment.js';

function mapAirEmission(row: any): AirEmission {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    emissionSourceId: row.emission_source_id,
    emissionType: row.emission_type,
    quantity: Number(row.quantity),
    unit: row.unit,
    monitoringFrequency: row.monitoring_frequency,
    emissionLimit: row.emission_limit ? Number(row.emission_limit) : null,
    concentration: row.concentration ? Number(row.concentration) : null,
    emissionDate: row.emission_date,
    reportingPeriod: row.reporting_period,
    recordedBy: row.recorded_by,
    isVerified: row.is_verified,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AirEmissionFilter {
  facilityId?: string;
  emissionSourceId?: string;
  emissionType?: AirEmissionType;
  reportingPeriod?: string;
  startDate?: string;
  endDate?: string;
}

export const airEmissionRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    emissionSourceId?: string | null;
    emissionType: AirEmissionType;
    quantity: number;
    unit?: string;
    monitoringFrequency?: string | null;
    emissionLimit?: number | null;
    concentration?: number | null;
    emissionDate: string;
    reportingPeriod: string;
    recordedBy?: string | null;
    notes?: string | null;
  }): Promise<AirEmission> {
    const { rows } = await query<AirEmission>(
      `INSERT INTO air_emissions (organization_id, facility_id, emission_source_id, emission_type, quantity, unit, monitoring_frequency, emission_limit, concentration, emission_date, reporting_period, recorded_by, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.emissionSourceId ?? null,
        input.emissionType,
        input.quantity,
        input.unit ?? 'kg',
        input.monitoringFrequency ?? null,
        input.emissionLimit ?? null,
        input.concentration ?? null,
        input.emissionDate,
        input.reportingPeriod,
        input.recordedBy ?? null,
        input.notes ?? null,
      ],
    );
    return mapAirEmission(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<AirEmission | null> {
    const { rows } = await query<AirEmission>(
      `SELECT * FROM air_emissions WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapAirEmission(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: AirEmissionFilter = {}): Promise<AirEmission[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.emissionSourceId) { where.push(`emission_source_id = $${i++}`); params.push(filter.emissionSourceId); }
    if (filter.emissionType) { where.push(`emission_type = $${i++}`); params.push(filter.emissionType); }
    if (filter.reportingPeriod) { where.push(`reporting_period = $${i++}`); params.push(filter.reportingPeriod); }
    if (filter.startDate) { where.push(`emission_date >= $${i++}`); params.push(filter.startDate); }
    if (filter.endDate) { where.push(`emission_date <= $${i++}`); params.push(filter.endDate); }
    const { rows } = await query<AirEmission>(
      `SELECT * FROM air_emissions WHERE ${where.join(' AND ')} ORDER BY emission_date DESC`,
      params,
    );
    return rows.map(mapAirEmission);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<AirEmission, 'emissionType' | 'quantity' | 'unit' | 'monitoringFrequency' | 'emissionLimit' | 'concentration' | 'emissionDate' | 'reportingPeriod' | 'isVerified' | 'notes'>>): Promise<AirEmission | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.emissionType !== undefined) set('emission_type', patch.emissionType);
    if (patch.quantity !== undefined) set('quantity', patch.quantity);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.monitoringFrequency !== undefined) set('monitoring_frequency', patch.monitoringFrequency);
    if (patch.emissionLimit !== undefined) set('emission_limit', patch.emissionLimit);
    if (patch.concentration !== undefined) set('concentration', patch.concentration);
    if (patch.emissionDate !== undefined) set('emission_date', patch.emissionDate);
    if (patch.reportingPeriod !== undefined) set('reporting_period', patch.reportingPeriod);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<AirEmission>(
      `UPDATE air_emissions SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapAirEmission(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE air_emissions SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
