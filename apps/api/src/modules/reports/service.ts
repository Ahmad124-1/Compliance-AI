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

async function fetchReportData(organizationId: string, type: ReportType, _filters?: Record<string, unknown>) {
  switch (type) {
    case 'audit': {
      const { rows } = await query(
        `SELECT a.id, a.title, a.status, a.created_at, a.updated_at, COUNT(af.id) AS findings_count
         FROM audits a
         LEFT JOIN audit_findings af ON af.audit_id = a.id
         WHERE a.organization_id = $1
         GROUP BY a.id, a.title, a.status, a.created_at, a.updated_at
         ORDER BY a.created_at DESC`,
        [organizationId],
      );
      return { title: 'Audit Report', headers: ['ID', 'Title', 'Status', 'Created', 'Updated', 'Findings'], rows: rows.map((r: any) => [r.id, r.title, r.status, r.created_at, r.updated_at, r.findings_count]) };
    }
    case 'assessment': {
      const { rows } = await query(
        `SELECT at.id, at.title, at.status, at.score, at.created_at, at.updated_at
         FROM assessments at
         WHERE at.organization_id = $1
         ORDER BY at.created_at DESC`,
        [organizationId],
      );
      return { title: 'Assessment Report', headers: ['ID', 'Title', 'Status', 'Score', 'Created', 'Updated'], rows: rows.map((r: any) => [r.id, r.title, r.status, r.score, r.created_at, r.updated_at]) };
    }
    case 'finding': {
      const { rows } = await query(
        `SELECT f.id, f.title, f.category, f.severity, f.status, f.risk_rating, f.created_at
         FROM findings f
         WHERE f.organization_id = $1
         ORDER BY f.created_at DESC`,
        [organizationId],
      );
      return { title: 'Finding Report', headers: ['ID', 'Title', 'Category', 'Severity', 'Status', 'Risk', 'Created'], rows: rows.map((r: any) => [r.id, r.title, r.category, r.severity, r.status, r.risk_rating, r.created_at]) };
    }
    case 'capa': {
      const { rows } = await query(
        `SELECT c.id, c.title, c.status, c.priority, c.severity, c.progress, c.due_date, c.created_at
         FROM capas c
         WHERE c.organization_id = $1
         ORDER BY c.created_at DESC`,
        [organizationId],
      );
      return { title: 'CAPA Report', headers: ['ID', 'Title', 'Status', 'Priority', 'Severity', 'Progress', 'Due Date', 'Created'], rows: rows.map((r: any) => [r.id, r.title, r.status, r.priority, r.severity, r.progress, r.due_date, r.created_at]) };
    }
    case 'worker_voice': {
      const { rows } = await query(
        `SELECT g.id, g.title, g.status, g.priority, g.category, g.created_at
         FROM grievances g
         WHERE g.organization_id = $1
         ORDER BY g.created_at DESC`,
        [organizationId],
      );
      return { title: 'Worker Voice Report', headers: ['ID', 'Title', 'Status', 'Priority', 'Category', 'Created'], rows: rows.map((r: any) => [r.id, r.title, r.status, r.priority, r.category, r.created_at]) };
    }
    case 'executive': {
      const kpis = await query(
        `SELECT
           (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND is_deleted = FALSE) AS total_cases,
           (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status = 'open' AND is_deleted = FALSE) AS open_cases,
           (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status = 'closed' AND is_deleted = FALSE) AS closed_cases,
           (SELECT COUNT(*) FROM cases WHERE organization_id = $1 AND status = 'escalated' AND is_deleted = FALSE) AS escalated_cases,
           (SELECT COUNT(*) FROM audits WHERE organization_id = $1) AS total_audits,
           (SELECT COUNT(*) FROM assessments WHERE organization_id = $1) AS total_assessments,
           (SELECT COUNT(*) FROM capas WHERE organization_id = $1) AS total_capas`,
        [organizationId],
      );
      const r = kpis.rows[0] ?? {};
      return {
        title: 'Executive Summary Report',
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Cases', r.total_cases ?? 0],
          ['Open Cases', r.open_cases ?? 0],
          ['Closed Cases', r.closed_cases ?? 0],
          ['Escalated Cases', r.escalated_cases ?? 0],
          ['Total Audits', r.total_audits ?? 0],
          ['Total Assessments', r.total_assessments ?? 0],
          ['Total CAPAs', r.total_capas ?? 0],
        ],
      };
    }
    case 'compliance': {
      const { rows } = await query(
        `SELECT cs.id, s.name AS standard_name, f.name AS framework_name, cs.status, cs.score, cs.created_at
         FROM compliance_status cs
         JOIN frameworks f ON f.id = cs.framework_id
         JOIN standards s ON s.id = f.standard_id
         WHERE cs.organization_id = $1
         ORDER BY cs.created_at DESC`,
        [organizationId],
      );
      return { title: 'Compliance Report', headers: ['ID', 'Standard', 'Framework', 'Status', 'Score', 'Created'], rows: rows.map((r: any) => [r.id, r.standard_name, r.framework_name, r.status, r.score, r.created_at]) };
    }
    case 'organization': {
      const org = await query(`SELECT name, created_at FROM organizations WHERE id = $1`, [organizationId]);
      const users = await query(`SELECT COUNT(*) AS count FROM users WHERE organization_id = $1`, [organizationId]);
      const cases = await query(`SELECT COUNT(*) AS count FROM cases WHERE organization_id = $1 AND is_deleted = FALSE`, [organizationId]);
      return {
        title: 'Organization Report',
        headers: ['Metric', 'Value'],
        rows: [
          ['Organization', org.rows[0]?.name || organizationId],
          ['Total Users', users.rows[0]?.count || 0],
          ['Total Cases', cases.rows[0]?.count || 0],
        ],
      };
    }
    case 'factory': {
      const { rows } = await query(
        `SELECT s.id, s.name, s.address, s.city, s.country, COUNT(DISTINCT d.id) AS departments, COUNT(DISTINCT t.id) AS teams
         FROM sites s
         LEFT JOIN departments d ON d.site_id = s.id
         LEFT JOIN teams t ON t.department_id = d.id
         WHERE s.organization_id = $1
         GROUP BY s.id, s.name, s.address, s.city, s.country
         ORDER BY s.name ASC`,
        [organizationId],
      );
      return { title: 'Factory Report', headers: ['ID', 'Name', 'Address', 'City', 'Country', 'Departments', 'Teams'], rows: rows.map((r: any) => [r.id, r.name, r.address, r.city, r.country, r.departments, r.teams]) };
    }
    case 'supplier': {
      const { rows } = await query(
        `SELECT DISTINCT category, COUNT(*) AS count, AVG(score) AS avg_score
         FROM assessments
         WHERE organization_id = $1 AND type = 'supplier'
         GROUP BY category
         ORDER BY count DESC`,
        [organizationId],
      );
      return { title: 'Supplier Report', headers: ['Category', 'Count', 'Avg Score'], rows: rows.map((r: any) => [r.category, r.count, r.avg_score]) };
    }
    case 'department': {
      const { rows } = await query(
        `SELECT d.id, d.name, s.name AS site_name, COUNT(DISTINCT t.id) AS teams, COUNT(DISTINCT c.id) AS cases
         FROM departments d
         JOIN sites s ON s.id = d.site_id
         LEFT JOIN teams t ON t.department_id = d.id
         LEFT JOIN cases c ON c.department_id = d.id AND c.is_deleted = FALSE
         WHERE d.organization_id = $1
         GROUP BY d.id, d.name, s.name
         ORDER BY d.name ASC`,
        [organizationId],
      );
      return { title: 'Department Report', headers: ['ID', 'Name', 'Site', 'Teams', 'Cases'], rows: rows.map((r: any) => [r.id, r.name, r.site_name, r.teams, r.cases]) };
    }
    default: {
      const { rows } = await query(
        `SELECT id, title, status, created_at, updated_at FROM cases WHERE organization_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC LIMIT 100`,
        [organizationId],
      );
      return { title: 'Custom Report', headers: ['ID', 'Title', 'Status', 'Created', 'Updated'], rows: rows.map((r: any) => [r.id, r.title, r.status, r.created_at, r.updated_at]) };
    }
  }
}

function buildCsv(data: { headers: string[]; rows: string[][] }): string {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [data.headers.map(escape).join(',')];
  for (const row of data.rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

function buildExcel(data: { headers: string[]; rows: string[][] }): string {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [data.headers.map(escape).join('\t')];
  for (const row of data.rows) {
    lines.push(row.map(escape).join('\t'));
  }
  return lines.join('\n');
}

function buildPrint(data: { title: string; headers: string[]; rows: string[][] }): string {
  const lines = [
    `<!DOCTYPE html><html><head><title>${data.title}</title><style>body{font-family:ui-sans-serif,system-ui;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px;text-align:left}th{background:#f5f5f5}</style></head><body>`,
    `<h1>${data.title}</h1>`,
    '<table><thead><tr>',
    data.headers.map((h) => `<th>${h}</th>`).join(''),
    '</tr></thead><tbody>',
    ...data.rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`),
    '</tbody></table></body></html>',
  ];
  return lines.join('');
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

    const data = await fetchReportData(organizationId, input.type, input.filters);

    await audit({
      organizationId,
      actorId: input.userId ?? null,
      action: 'report.generated',
      entity: 'report',
      entityId: id,
      metadata: { type: input.type, format: input.format, title, rows: data.rows.length },
    });

    await query(
      `INSERT INTO reports (id, organization_id, user_id, type, format, title, status, summary, filters)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        organizationId,
        input.userId ?? null,
        input.type,
        input.format,
        title,
        'ready',
        `${data.title}: ${data.rows.length} rows`,
        JSON.stringify(input.filters ?? {}),
      ],
    );

    return {
      id,
      title,
      type: input.type,
      format: input.format,
      status: 'ready',
      downloadUrl: createDownloadUrl(id, input.format),
      generatedAt: new Date().toISOString(),
      summary: `${title} generated with ${data.rows.length} rows.`,
    };
  },

  async getExportPayload(organizationId: string, id: string, format: ReportFormat) {
    const { rows } = await query(`SELECT id, organization_id, type, format, title, filters FROM reports WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Report not found');

    const report = rows[0];
    const data = await fetchReportData(organizationId, report.type, report.filters);

    let content: string;
    let contentType: string;
    switch (format) {
      case 'csv':
        content = buildCsv(data);
        contentType = 'text/csv';
        break;
      case 'excel':
        content = buildExcel(data);
        contentType = 'text/tab-separated-values';
        break;
      case 'print':
        content = buildPrint(data);
        contentType = 'text/html';
        break;
      case 'pdf':
      default:
        content = buildPrint(data);
        contentType = 'text/html';
        break;
    }

    return {
      id,
      organizationId,
      format,
      contentType,
      content,
      title: report.title,
      generatedAt: new Date().toISOString(),
    };
  },
};
