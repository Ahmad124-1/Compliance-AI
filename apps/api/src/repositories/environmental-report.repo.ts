import { query } from '../db/pool.js';

export interface EnvironmentalReport {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  reportType: string;
  format: string;
  status: string;
  fileUrl: string | null;
  summary: string | null;
  chartData: Record<string, unknown>;
  params: Record<string, unknown>;
  generatedBy: string | null;
  generatedAt: string | null;
  schedule: string;
  lastGeneratedAt: string | null;
  nextScheduledAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapEnvironmentalReport(row: any): EnvironmentalReport {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    name: row.name,
    description: row.description,
    reportType: row.report_type,
    format: row.format,
    status: row.status,
    fileUrl: row.file_url,
    summary: row.summary,
    chartData: row.chart_data || {},
    params: row.params || {},
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    schedule: row.schedule || 'none',
    lastGeneratedAt: row.last_generated_at,
    nextScheduledAt: row.next_scheduled_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EnvironmentalReportFilter {
  facilityId?: string;
  reportType?: string;
  status?: string;
  format?: string;
}

export const environmentalReportRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    name: string;
    description?: string | null;
    reportType: string;
    format?: string;
    status?: string;
    fileUrl?: string | null;
    summary?: string | null;
    chartData?: Record<string, unknown>;
    params?: Record<string, unknown>;
    generatedBy?: string | null;
    generatedAt?: string | null;
    schedule?: string;
    lastGeneratedAt?: string | null;
    nextScheduledAt?: string | null;
  }): Promise<EnvironmentalReport> {
    const { rows } = await query<EnvironmentalReport>(
      `INSERT INTO environmental_reports (organization_id, facility_id, name, description, report_type, format, status, file_url, summary, chart_data, params, generated_by, generated_at, schedule, last_generated_at, next_scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.name,
        input.description ?? null,
        input.reportType,
        input.format ?? 'pdf',
        input.status ?? 'draft',
        input.fileUrl ?? null,
        input.summary ?? null,
        input.chartData ?? {},
        input.params ?? {},
        input.generatedBy ?? null,
        input.generatedAt ?? null,
        input.schedule ?? 'none',
        input.lastGeneratedAt ?? null,
        input.nextScheduledAt ?? null,
      ],
    );
    return mapEnvironmentalReport(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EnvironmentalReport | null> {
    const { rows } = await query<EnvironmentalReport>(
      `SELECT * FROM environmental_reports WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEnvironmentalReport(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EnvironmentalReportFilter = {}): Promise<EnvironmentalReport[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.reportType) { where.push(`report_type = $${i++}`); params.push(filter.reportType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.format) { where.push(`format = $${i++}`); params.push(filter.format); }
    const { rows } = await query<EnvironmentalReport>(
      `SELECT * FROM environmental_reports WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEnvironmentalReport);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EnvironmentalReport, 'name' | 'description' | 'reportType' | 'format' | 'status' | 'fileUrl' | 'summary' | 'chartData' | 'params' | 'generatedBy' | 'generatedAt' | 'schedule' | 'lastGeneratedAt' | 'nextScheduledAt'>>): Promise<EnvironmentalReport | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.reportType !== undefined) set('report_type', patch.reportType);
    if (patch.format !== undefined) set('format', patch.format);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.fileUrl !== undefined) set('file_url', patch.fileUrl);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.chartData !== undefined) set('chart_data', JSON.stringify(patch.chartData));
    if (patch.params !== undefined) set('params', JSON.stringify(patch.params));
    if (patch.generatedBy !== undefined) set('generated_by', patch.generatedBy);
    if (patch.generatedAt !== undefined) set('generated_at', patch.generatedAt);
    if (patch.schedule !== undefined) set('schedule', patch.schedule);
    if (patch.lastGeneratedAt !== undefined) set('last_generated_at', patch.lastGeneratedAt);
    if (patch.nextScheduledAt !== undefined) set('next_scheduled_at', patch.nextScheduledAt);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EnvironmentalReport>(
      `UPDATE environmental_reports SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEnvironmentalReport(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE environmental_reports SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

