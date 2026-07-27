import { query } from '../db/pool.js';
import type { KpiMeasurement } from '../types/sustainability.js';

function mapMeasurement(row: any): KpiMeasurement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    kpiId: row.kpi_id,
    value: parseFloat(row.value),
    recordedAt: row.recorded_at,
    recordedBy: row.recorded_by,
    source: row.source,
    notes: row.notes,
    departmentId: row.department_id,
    facilityId: row.facility_id,
    createdAt: row.created_at,
  };
}

export const kpiMeasurementRepo = {
  async create(input: {
    organizationId: string;
    kpiId: string;
    value: number;
    recordedBy?: string;
    source?: string;
    notes?: string;
    departmentId?: string;
    facilityId?: string;
  }): Promise<KpiMeasurement> {
    const { rows } = await query<KpiMeasurement>(
      `INSERT INTO kpi_measurements (organization_id, kpi_id, value, recorded_by, source, notes, department_id, facility_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.kpiId,
        input.value,
        input.recordedBy ?? null,
        input.source ?? null,
        input.notes ?? null,
        input.departmentId ?? null,
        input.facilityId ?? null,
      ],
    );
    return mapMeasurement(rows[0]);
  },

  async listByKpi(kpiId: string, orgId: string, limit?: number, offset?: number): Promise<KpiMeasurement[]> {
    const { rows } = await query<KpiMeasurement>(
      `SELECT * FROM kpi_measurements WHERE kpi_id = $1 AND organization_id = $2 ORDER BY recorded_at DESC LIMIT $${3} OFFSET $${4}`,
      [kpiId, orgId, limit ?? 100, offset ?? 0],
    );
    return rows.map(mapMeasurement);
  },

  async getLatest(kpiId: string, orgId: string): Promise<KpiMeasurement | null> {
    const { rows } = await query<KpiMeasurement>(
      `SELECT * FROM kpi_measurements WHERE kpi_id = $1 AND organization_id = $2 ORDER BY recorded_at DESC LIMIT 1`,
      [kpiId, orgId],
    );
    return rows[0] ? mapMeasurement(rows[0]) : null;
  },

  async getTrend(kpiId: string, orgId: string, fromDate: string, toDate: string): Promise<KpiMeasurement[]> {
    const { rows } = await query<KpiMeasurement>(
      `SELECT * FROM kpi_measurements WHERE kpi_id = $1 AND organization_id = $2 AND recorded_at BETWEEN $3 AND $4 ORDER BY recorded_at ASC`,
      [kpiId, orgId, fromDate, toDate],
    );
    return rows.map(mapMeasurement);
  },

  async getAggregated(kpiId: string, orgId: string, frequency: string, dateFrom?: string, dateTo?: string): Promise<{ period: string; value: number }[]> {
    let dateFilter = '';
    const params: unknown[] = [kpiId, orgId];
    let i = 3;
    if (dateFrom) {
      dateFilter += ` AND recorded_at >= $${i++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      dateFilter += ` AND recorded_at <= $${i++}`;
      params.push(dateTo);
    }
    let groupExpr: string;
    switch (frequency) {
      case 'daily':
        groupExpr = 'DATE(recorded_at)';
        break;
      case 'weekly':
        groupExpr = "DATE_TRUNC('week', recorded_at)";
        break;
      case 'monthly':
        groupExpr = "DATE_TRUNC('month', recorded_at)";
        break;
      case 'quarterly':
        groupExpr = "DATE_TRUNC('quarter', recorded_at)";
        break;
      case 'yearly':
        groupExpr = "DATE_TRUNC('year', recorded_at)";
        break;
      default:
        groupExpr = "DATE_TRUNC('month', recorded_at)";
    }
    const { rows } = await query<{ period: string; value: string }>(
      `SELECT ${groupExpr} AS period, AVG(value) AS value FROM kpi_measurements WHERE kpi_id = $1 AND organization_id = $2 ${dateFilter} GROUP BY ${groupExpr} ORDER BY period ASC`,
      params,
    );
    return rows.map((r) => ({ period: r.period, value: parseFloat(r.value) }));
  },
};