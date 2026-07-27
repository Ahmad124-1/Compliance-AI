import { query } from '../db/pool.js';
import type { CarbonReport, CarbonReportType } from '../types/carbon.js';

function mapCarbonReport(row: any): CarbonReport {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    name: row.name,
    description: row.description,
    reportType: row.report_type,
    format: row.format,
    generatedBy: row.generated_by,
    status: row.status,
    fileUrl: row.file_url,
    summary: row.summary,
    params: row.params ?? {},
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CarbonReportFilter {
  reportType?: CarbonReportType;
  status?: string;
}

export const carbonReportRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string;
    name: string;
    description?: string;
    reportType: CarbonReportType;
    format: 'pdf' | 'xlsx' | 'csv';
    generatedBy?: string;
    status?: 'draft' | 'generated' | 'archived';
    fileUrl?: string;
    summary?: string;
    params?: Record<string, unknown>;
  }): Promise<CarbonReport> {
    const { rows } = await query<CarbonReport>(
      `INSERT INTO carbon_reports (organization_id, facility_id, name, description, report_type, format, generated_by, status, file_url, summary, params)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.name,
        input.description ?? null,
        input.reportType,
        input.format,
        input.generatedBy ?? null,
        input.status ?? 'draft',
        input.fileUrl ?? null,
        input.summary ?? null,
        input.params ?? {},
      ],
    );
    return mapCarbonReport(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<CarbonReport | null> {
    const { rows } = await query<CarbonReport>(
      `SELECT * FROM carbon_reports WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapCarbonReport(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: CarbonReportFilter = {}): Promise<CarbonReport[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.reportType) {
      where.push(`report_type = $${i++}`);
      params.push(filter.reportType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    const { rows } = await query<CarbonReport>(
      `SELECT * FROM carbon_reports WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapCarbonReport);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<CarbonReport, 'facilityId' | 'name' | 'description' | 'reportType' | 'format' | 'generatedBy' | 'status' | 'fileUrl' | 'summary' | 'params'>>): Promise<CarbonReport | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.facilityId !== undefined) set('facility_id', patch.facilityId);
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.reportType !== undefined) set('report_type', patch.reportType);
    if (patch.format !== undefined) set('format', patch.format);
    if (patch.generatedBy !== undefined) set('generated_by', patch.generatedBy);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.fileUrl !== undefined) set('file_url', patch.fileUrl);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.params !== undefined) set('params', patch.params);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<CarbonReport>(
      `UPDATE carbon_reports SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapCarbonReport(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE carbon_reports SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
