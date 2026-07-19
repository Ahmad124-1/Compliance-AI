import { audit } from '../../core/audit.js';
import { query } from '../../db/pool.js';
import { NotFoundError } from '../../core/errors.js';

export type ReportType = 'audit' | 'assessment' | 'finding' | 'capa' | 'worker_voice' | 'executive' | 'compliance' | 'organization' | 'factory' | 'supplier' | 'department' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'print';

export interface ReportTemplate {
  id: string;
  organizationId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  description?: string | null;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRequest {
  organizationId: string;
  userId?: string | null;
  type: ReportType;
  format: ReportFormat;
  title?: string;
  filters?: Record<string, unknown>;
  includeCharts?: boolean;
}

export interface ReportResult {
  id: string;
  title: string;
  type: ReportType;
  format: ReportFormat;
  status: 'ready' | 'queued';
  downloadUrl: string;
  generatedAt: string;
  summary: string;
}

function createDownloadUrl(id: string, format: ReportFormat): string {
  return `/api/v1/reports/${id}/download?format=${format}`;
}

export const reportsService = {
  async listTemplates(organizationId: string): Promise<ReportTemplate[]> {
    const { rows } = await query(
      `SELECT id, organization_id, name, type, format, description, is_default, created_at, updated_at
       FROM report_templates WHERE organization_id = $1 ORDER BY name ASC`,
      [organizationId],
    );
    return rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      type: row.type,
      format: row.format,
      description: row.description,
      isDefault: row.is_default,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    }));
  },

  async createTemplate(organizationId: string, input: { name: string; type: ReportType; format: ReportFormat; description?: string | null; isDefault?: boolean }) {
    const { rows } = await query(
      `INSERT INTO report_templates (organization_id, name, type, format, description, is_default)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, organization_id, name, type, format, description, is_default, created_at, updated_at`,
      [organizationId, input.name, input.type, input.format, input.description ?? null, input.isDefault ?? false],
    );
    return rows[0];
  },

  async generate(input: ReportRequest): Promise<ReportResult> {
    const organizationId = input.organizationId;
    const title = input.title ?? `${input.type} report`;
    const id = `report-${Math.random().toString(36).slice(2, 10)}`;

    await audit({
      organizationId,
      actorId: input.userId ?? null,
      action: 'report.generated',
      entity: 'report',
      entityId: id,
      metadata: { type: input.type, format: input.format, title },
    });

    return {
      id,
      title,
      type: input.type,
      format: input.format,
      status: 'ready',
      downloadUrl: createDownloadUrl(id, input.format),
      generatedAt: new Date().toISOString(),
      summary: `${title} is ready for ${input.format.toUpperCase()} export.`,
    };
  },

  async getExportPayload(organizationId: string, id: string, format: ReportFormat) {
    const { rows } = await query(`SELECT id, organization_id, name, type, format FROM report_templates WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Report template not found');
    return {
      id,
      organizationId,
      format,
      payload: {
        rows: [],
        generatedAt: new Date().toISOString(),
        title: rows[0].name,
      },
    };
  },
};
