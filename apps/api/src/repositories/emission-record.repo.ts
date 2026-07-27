import { query } from '../db/pool.js';
import type { EmissionRecord, CalculationMethod } from '../types/carbon.js';

function mapEmissionRecord(row: any): EmissionRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    emissionSourceId: row.emission_source_id,
    scopeId: row.scope_id,
    activityType: row.activity_type,
    activityData: row.activity_data ?? {},
    co2e: parseFloat(row.co2e),
    co2: row.co2 !== null ? parseFloat(row.co2) : null,
    ch4: row.ch4 !== null ? parseFloat(row.ch4) : null,
    n2o: row.n2o !== null ? parseFloat(row.n2o) : null,
    hfc: row.hfc !== null ? parseFloat(row.hfc) : null,
    pfc: row.pfc !== null ? parseFloat(row.pfc) : null,
    sf6: row.sf6 !== null ? parseFloat(row.sf6) : null,
    unit: row.unit,
    emissionDate: row.emission_date,
    reportingPeriod: row.reporting_period,
    calculationMethod: row.calculation_method,
    emissionFactorId: row.emission_factor_id,
    manualOverride: row.manual_override,
    overrideReason: row.override_reason,
    notes: row.notes,
    recordedBy: row.recorded_by,
    isVerified: row.is_verified,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EmissionRecordFilter {
  facilityId?: string;
  emissionSourceId?: string;
  scopeId?: string;
  reportingPeriod?: string;
  emissionDate?: string;
}

export const emissionRecordRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string;
    emissionSourceId?: string;
    scopeId?: string;
    activityType: string;
    activityData?: Record<string, unknown>;
    co2e: number;
    co2?: number | null;
    ch4?: number | null;
    n2o?: number | null;
    hfc?: number | null;
    pfc?: number | null;
    sf6?: number | null;
    unit: string;
    emissionDate: string;
    reportingPeriod: string;
    calculationMethod: CalculationMethod;
    emissionFactorId?: string;
    manualOverride?: boolean;
    overrideReason?: string;
    notes?: string;
    recordedBy?: string;
    isVerified?: boolean;
  }): Promise<EmissionRecord> {
    const { rows } = await query<EmissionRecord>(
      `INSERT INTO emission_records (organization_id, facility_id, emission_source_id, scope_id, activity_type, activity_data, co2e, co2, ch4, n2o, hfc, pfc, sf6, unit, emission_date, reporting_period, calculation_method, emission_factor_id, manual_override, override_reason, notes, recorded_by, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.emissionSourceId ?? null,
        input.scopeId ?? null,
        input.activityType,
        input.activityData ?? {},
        input.co2e,
        input.co2 ?? null,
        input.ch4 ?? null,
        input.n2o ?? null,
        input.hfc ?? null,
        input.pfc ?? null,
        input.sf6 ?? null,
        input.unit,
        input.emissionDate,
        input.reportingPeriod,
        input.calculationMethod,
        input.emissionFactorId ?? null,
        input.manualOverride ?? false,
        input.overrideReason ?? null,
        input.notes ?? null,
        input.recordedBy ?? null,
        input.isVerified ?? false,
      ],
    );
    return mapEmissionRecord(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EmissionRecord | null> {
    const { rows } = await query<EmissionRecord>(
      `SELECT * FROM emission_records WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEmissionRecord(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EmissionRecordFilter = {}): Promise<EmissionRecord[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    if (filter.emissionSourceId) {
      where.push(`emission_source_id = $${i++}`);
      params.push(filter.emissionSourceId);
    }
    if (filter.scopeId) {
      where.push(`scope_id = $${i++}`);
      params.push(filter.scopeId);
    }
    if (filter.reportingPeriod) {
      where.push(`reporting_period = $${i++}`);
      params.push(filter.reportingPeriod);
    }
    if (filter.emissionDate) {
      where.push(`emission_date = $${i++}`);
      params.push(filter.emissionDate);
    }
    const { rows } = await query<EmissionRecord>(
      `SELECT * FROM emission_records WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEmissionRecord);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EmissionRecord, 'facilityId' | 'emissionSourceId' | 'scopeId' | 'activityType' | 'activityData' | 'co2e' | 'co2' | 'ch4' | 'n2o' | 'hfc' | 'pfc' | 'sf6' | 'unit' | 'emissionDate' | 'reportingPeriod' | 'calculationMethod' | 'emissionFactorId' | 'manualOverride' | 'overrideReason' | 'notes' | 'recordedBy' | 'isVerified'>>): Promise<EmissionRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.emissionSourceId !== undefined) set('emission_source_id', patch.emissionSourceId);
    if (patch.scopeId !== undefined) set('scope_id', patch.scopeId);
    if (patch.activityType !== undefined) set('activity_type', patch.activityType);
    if (patch.activityData !== undefined) set('activity_data', patch.activityData);
    if (patch.co2e !== undefined) set('co2e', patch.co2e);
    if (patch.co2 !== undefined) set('co2', patch.co2);
    if (patch.ch4 !== undefined) set('ch4', patch.ch4);
    if (patch.n2o !== undefined) set('n2o', patch.n2o);
    if (patch.hfc !== undefined) set('hfc', patch.hfc);
    if (patch.pfc !== undefined) set('pfc', patch.pfc);
    if (patch.sf6 !== undefined) set('sf6', patch.sf6);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.emissionDate !== undefined) set('emission_date', patch.emissionDate);
    if (patch.reportingPeriod !== undefined) set('reporting_period', patch.reportingPeriod);
    if (patch.calculationMethod !== undefined) set('calculation_method', patch.calculationMethod);
    if (patch.emissionFactorId !== undefined) set('emission_factor_id', patch.emissionFactorId);
    if (patch.manualOverride !== undefined) set('manual_override', patch.manualOverride);
    if (patch.overrideReason !== undefined) set('override_reason', patch.overrideReason);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (patch.recordedBy !== undefined) set('recorded_by', patch.recordedBy);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EmissionRecord>(
      `UPDATE emission_records SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEmissionRecord(rows[0]) : null;
  },

  async getEmissionsByPeriod(orgId: string, reportingPeriod: string): Promise<EmissionRecord[]> {
    const { rows } = await query<EmissionRecord>(
      `SELECT * FROM emission_records WHERE organization_id = $1 AND reporting_period = $2 AND is_deleted = FALSE ORDER BY created_at DESC`,
      [orgId, reportingPeriod],
    );
    return rows.map(mapEmissionRecord);
  },

  async getEmissionsByScope(orgId: string, scopeId: string): Promise<EmissionRecord[]> {
    const { rows } = await query<EmissionRecord>(
      `SELECT * FROM emission_records WHERE organization_id = $1 AND scope_id = $2 AND is_deleted = FALSE ORDER BY created_at DESC`,
      [orgId, scopeId],
    );
    return rows.map(mapEmissionRecord);
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE emission_records SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },

  async getTopSources(orgId: string): Promise<{ sourceName: string; co2e: number }[]> {
    const { rows } = await query<{ activity_type: string; co2e_sum: string }>(
      `SELECT activity_type, SUM(co2e) as co2e_sum FROM emission_records WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY activity_type ORDER BY co2e_sum DESC LIMIT 5`,
      [orgId],
    );
    return rows.map(r => ({ sourceName: r.activity_type, co2e: parseFloat(r.co2e_sum) }));
  },

  async getMonthlyEmissions(orgId: string): Promise<{ month: string; scope1: number; scope2: number; scope3: number }[]> {
    const { rows } = await query<{ month: string; scope_number: number; co2e_sum: string }>(
      `SELECT TO_CHAR(er.emission_date, 'YYYY-MM') as month, s.scope_number, SUM(er.co2e) as co2e_sum FROM emission_records er LEFT JOIN ghg_scopes s ON s.id = er.scope_id WHERE er.organization_id = $1 AND er.is_deleted = FALSE GROUP BY month, s.scope_number ORDER BY month`,
      [orgId],
    );
    const map = new Map<string, { scope1: number; scope2: number; scope3: number }>();
    for (const r of rows) {
      const cur = map.get(r.month) || { scope1: 0, scope2: 0, scope3: 0 };
      if (r.scope_number === 1) cur.scope1 = parseFloat(r.co2e_sum);
      else if (r.scope_number === 2) cur.scope2 = parseFloat(r.co2e_sum);
      else cur.scope3 = parseFloat(r.co2e_sum);
      map.set(r.month, cur);
    }
    return Array.from(map.entries()).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month));
  },

  async getYearlyEmissions(orgId: string): Promise<{ year: string; total: number }[]> {
    const { rows } = await query<{ year: string; total: string }>(
      `SELECT TO_CHAR(emission_date, 'YYYY') as year, SUM(co2e) as total FROM emission_records WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY year ORDER BY year`,
      [orgId],
    );
    return rows.map(r => ({ year: r.year, total: parseFloat(r.total) }));
  },

  async getFacilityComparison(orgId: string): Promise<{ facilityName: string; emissions: number }[]> {
    const { rows } = await query<{ name: string; co2e_sum: string }>(
      `SELECT f.name, SUM(er.co2e) as co2e_sum FROM emission_records er JOIN facilities f ON f.id = er.facility_id WHERE er.organization_id = $1 AND er.is_deleted = FALSE AND er.facility_id IS NOT NULL GROUP BY f.name ORDER BY co2e_sum DESC`,
      [orgId],
    );
    return rows.map(r => ({ facilityName: r.name, emissions: parseFloat(r.co2e_sum) }));
  },
};
