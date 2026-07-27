import { query } from '../db/pool.js';
import type { EsgDataPoint } from '../types/esg.js';

function mapDataPoint(row: any): EsgDataPoint {
  return {
    id: row.id,
    organizationId: row.organization_id,
    metricId: row.metric_id,
    periodId: row.period_id,
    facilityId: row.facility_id,
    departmentId: row.department_id,
    value: parseFloat(row.value),
    valueText: row.value_text,
    valueJson: row.value_json ?? {},
    unit: row.unit,
    confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : null,
    isVerified: row.is_verified,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    sourceSystem: row.source_system,
    sourceReference: row.source_reference,
    notes: row.notes,
    recordedBy: row.recorded_by,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DataPointFilter {
  metricId?: string;
  periodId?: string;
  facilityId?: string;
  departmentId?: string;
  isVerified?: boolean;
}

export const esgDataPointRepo = {
  async create(input: {
    organizationId: string;
    metricId: string;
    periodId: string;
    facilityId?: string;
    departmentId?: string;
    value: number;
    valueText?: string;
    valueJson?: Record<string, unknown>;
    unit?: string;
    confidenceScore?: number;
    sourceSystem?: string;
    sourceReference?: string;
    notes?: string;
    recordedBy?: string;
  }): Promise<EsgDataPoint> {
    const { rows } = await query<EsgDataPoint>(
      `INSERT INTO esg_data_points (organization_id, metric_id, period_id, facility_id, department_id, value, value_text, value_json, unit, confidence_score, source_system, source_reference, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.metricId,
        input.periodId,
        input.facilityId ?? null,
        input.departmentId ?? null,
        input.value,
        input.valueText ?? null,
        input.valueJson ?? {},
        input.unit ?? null,
        input.confidenceScore ?? null,
        input.sourceSystem ?? null,
        input.sourceReference ?? null,
        input.notes ?? null,
        input.recordedBy ?? null,
      ],
    );
    return mapDataPoint(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgDataPoint | null> {
    const { rows } = await query<EsgDataPoint>(
      `SELECT * FROM esg_data_points WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapDataPoint(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: DataPointFilter = {}): Promise<EsgDataPoint[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.metricId) {
      where.push(`metric_id = $${i++}`);
      params.push(filter.metricId);
    }
    if (filter.periodId) {
      where.push(`period_id = $${i++}`);
      params.push(filter.periodId);
    }
    if (filter.facilityId) {
      where.push(`facility_id = $${i++}`);
      params.push(filter.facilityId);
    }
    if (filter.departmentId) {
      where.push(`department_id = $${i++}`);
      params.push(filter.departmentId);
    }
    if (filter.isVerified !== undefined) {
      where.push(`is_verified = $${i++}`);
      params.push(filter.isVerified);
    }
    const { rows } = await query<EsgDataPoint>(
      `SELECT * FROM esg_data_points WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapDataPoint);
  },

  async listByPeriodAndMetric(periodId: string, metricId: string, orgId: string): Promise<EsgDataPoint[]> {
    const { rows } = await query<EsgDataPoint>(
      `SELECT * FROM esg_data_points WHERE period_id = $1 AND metric_id = $2 AND organization_id = $3 AND is_deleted = FALSE`,
      [periodId, metricId, orgId],
    );
    return rows.map(mapDataPoint);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgDataPoint, 'value' | 'valueText' | 'valueJson' | 'confidenceScore' | 'isVerified' | 'verifiedBy' | 'verifiedAt' | 'notes'>>): Promise<EsgDataPoint | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.value !== undefined) set('value', patch.value);
    if (patch.valueText !== undefined) set('value_text', patch.valueText);
    if (patch.valueJson !== undefined) set('value_json', patch.valueJson);
    if (patch.confidenceScore !== undefined) set('confidence_score', patch.confidenceScore);
    if (patch.isVerified !== undefined) set('is_verified', patch.isVerified);
    if (patch.verifiedBy !== undefined) set('verified_by', patch.verifiedBy);
    if (patch.verifiedAt !== undefined) set('verified_at', patch.verifiedAt);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgDataPoint>(
      `UPDATE esg_data_points SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapDataPoint(rows[0]) : null;
  },

  async verify(id: string, orgId: string, verifiedBy: string): Promise<EsgDataPoint | null> {
    const { rows } = await query<EsgDataPoint>(
      `UPDATE esg_data_points SET is_verified = TRUE, verified_by = $1, verified_at = now() WHERE id = $2 AND organization_id = $3 AND is_deleted = FALSE RETURNING *`,
      [verifiedBy, id, orgId],
    );
    return rows[0] ? mapDataPoint(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_data_points SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
