import { query } from '../db/pool.js';
import type { EsgReport } from '../types/esg.js';

function mapReport(row: any): EsgReport {
  return {
    id: row.id,
    organizationId: row.organization_id,
    periodId: row.period_id,
    name: row.name,
    description: row.description,
    reportType: row.report_type,
    format: row.format,
    status: row.status,
    fileUrl: row.file_url,
    fileSizeBytes: row.file_size_bytes ? parseInt(row.file_size_bytes, 10) : null,
    pagesCount: row.pages_count ? parseInt(row.pages_count, 10) : null,
    summary: row.summary,
    params: row.params ?? {},
    generatedBy: row.generated_by,
    generatedAt: row.generated_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ReportFilter {
  periodId?: string;
  reportType?: string;
  status?: string;
  format?: string;
}

export const esgReportRepo = {
  async create(input: {
    organizationId: string;
    periodId: string;
    name: string;
    description?: string;
    reportType: string;
    format: string;
    params?: Record<string, unknown>;
  }): Promise<EsgReport> {
    const { rows } = await query<EsgReport>(
      `INSERT INTO esg_reports (organization_id, period_id, name, description, report_type, format, params)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.periodId,
        input.name,
        input.description ?? null,
        input.reportType,
        input.format,
        input.params ?? {},
      ],
    );
    return mapReport(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgReport | null> {
    const { rows } = await query<EsgReport>(
      `SELECT * FROM esg_reports WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapReport(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ReportFilter = {}): Promise<EsgReport[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.periodId) {
      where.push(`period_id = $${i++}`);
      params.push(filter.periodId);
    }
    if (filter.reportType) {
      where.push(`report_type = $${i++}`);
      params.push(filter.reportType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.format) {
      where.push(`format = $${i++}`);
      params.push(filter.format);
    }
    const { rows } = await query<EsgReport>(
      `SELECT * FROM esg_reports WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapReport);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgReport, 'name' | 'description' | 'status' | 'fileUrl' | 'fileSizeBytes' | 'pagesCount' | 'summary' | 'params' | 'generatedBy' | 'generatedAt' | 'approvedBy' | 'approvedAt' | 'publishedAt'>>): Promise<EsgReport | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.fileUrl !== undefined) set('file_url', patch.fileUrl);
    if (patch.fileSizeBytes !== undefined) set('file_size_bytes', patch.fileSizeBytes);
    if (patch.pagesCount !== undefined) set('pages_count', patch.pagesCount);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.params !== undefined) set('params', patch.params);
    if (patch.generatedBy !== undefined) set('generated_by', patch.generatedBy);
    if (patch.generatedAt !== undefined) set('generated_at', patch.generatedAt);
    if (patch.approvedBy !== undefined) set('approved_by', patch.approvedBy);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (patch.publishedAt !== undefined) set('published_at', patch.publishedAt);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgReport>(
      `UPDATE esg_reports SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapReport(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_reports SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
