import { query } from '../db/pool.js';
import type { SustainabilityReport } from '../types/sustainability.js';

function mapReport(row: any): SustainabilityReport {
  return {
    id: row.id,
    organizationId: row.organization_id,
    programId: row.program_id,
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

export interface ReportFilter {
  search?: string;
  reportType?: string;
  status?: string;
  programId?: string;
}

export const sustainabilityReportRepo = {
  async create(input: {
    organizationId: string;
    programId?: string;
    name: string;
    description?: string;
    reportType: string;
    format?: string;
    generatedBy?: string;
    params?: Record<string, unknown>;
  }): Promise<SustainabilityReport> {
    const { rows } = await query<SustainabilityReport>(
      `INSERT INTO sustainability_reports (organization_id, program_id, name, description, report_type, format, generated_by, params)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.programId ?? null,
        input.name,
        input.description ?? null,
        input.reportType,
        input.format ?? 'pdf',
        input.generatedBy ?? null,
        input.params ?? {},
      ],
    );
    return mapReport(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityReport | null> {
    const { rows } = await query<SustainabilityReport>(
      `SELECT * FROM sustainability_reports WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapReport(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: ReportFilter = {}): Promise<SustainabilityReport[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`name ILIKE $${i++}`);
      params.push(`%${filter.search}%`);
    }
    if (filter.reportType) {
      where.push(`report_type = $${i++}`);
      params.push(filter.reportType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.programId) {
      where.push(`program_id = $${i++}`);
      params.push(filter.programId);
    }
    const { rows } = await query<SustainabilityReport>(
      `SELECT * FROM sustainability_reports WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapReport);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SustainabilityReport, 'name' | 'description' | 'status' | 'fileUrl' | 'summary' | 'params'>>): Promise<SustainabilityReport | null> {
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
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.params !== undefined) set('params', patch.params);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SustainabilityReport>(
      `UPDATE sustainability_reports SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapReport(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_reports SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

