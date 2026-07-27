import { query } from '../db/pool.js';
import type { EsgDisclosure } from '../types/esg.js';

function mapDisclosure(row: any): EsgDisclosure {
  return {
    id: row.id,
    organizationId: row.organization_id,
    frameworkId: row.framework_id,
    metricId: row.metric_id,
    periodId: row.period_id,
    name: row.name,
    description: row.description,
    category: row.category,
    pillar: row.pillar,
    status: row.status,
    content: row.content ?? {},
    summary: row.summary,
    pageReference: row.page_reference,
    linkedDocuments: row.linked_documents ?? [],
    dataPoints: row.data_points ?? [],
    assuranceStatus: row.assurance_status,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface DisclosureFilter {
  periodId?: string;
  frameworkId?: string;
  pillar?: string;
  status?: string;
  assuranceStatus?: string;
}

export const esgDisclosureRepo = {
  async create(input: {
    organizationId: string;
    frameworkId?: string;
    metricId?: string;
    periodId: string;
    name: string;
    description?: string;
    category: string;
    pillar: string;
    content?: Record<string, unknown>;
    summary?: string;
    pageReference?: string;
    linkedDocuments?: string[];
    dataPoints?: string[];
  }): Promise<EsgDisclosure> {
    const { rows } = await query<EsgDisclosure>(
      `INSERT INTO esg_disclosures (organization_id, framework_id, metric_id, period_id, name, description, category, pillar, content, summary, page_reference, linked_documents, data_points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        input.organizationId,
        input.frameworkId ?? null,
        input.metricId ?? null,
        input.periodId,
        input.name,
        input.description ?? null,
        input.category,
        input.pillar,
        input.content ?? {},
        input.summary ?? null,
        input.pageReference ?? null,
        input.linkedDocuments ?? [],
        input.dataPoints ?? [],
      ],
    );
    return mapDisclosure(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgDisclosure | null> {
    const { rows } = await query<EsgDisclosure>(
      `SELECT * FROM esg_disclosures WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapDisclosure(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: DisclosureFilter = {}): Promise<EsgDisclosure[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.periodId) {
      where.push(`period_id = $${i++}`);
      params.push(filter.periodId);
    }
    if (filter.frameworkId) {
      where.push(`framework_id = $${i++}`);
      params.push(filter.frameworkId);
    }
    if (filter.pillar) {
      where.push(`pillar = $${i++}`);
      params.push(filter.pillar);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter.assuranceStatus) {
      where.push(`assurance_status = $${i++}`);
      params.push(filter.assuranceStatus);
    }
    const { rows } = await query<EsgDisclosure>(
      `SELECT * FROM esg_disclosures WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapDisclosure);
  },

  async listByPeriod(periodId: string, orgId: string): Promise<EsgDisclosure[]> {
    const { rows } = await query<EsgDisclosure>(
      `SELECT * FROM esg_disclosures WHERE period_id = $1 AND organization_id = $2 AND is_deleted = FALSE ORDER BY created_at DESC`,
      [periodId, orgId],
    );
    return rows.map(mapDisclosure);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgDisclosure, 'name' | 'description' | 'status' | 'content' | 'summary' | 'pageReference' | 'linkedDocuments' | 'dataPoints' | 'assuranceStatus' | 'submittedBy' | 'submittedAt' | 'reviewedBy' | 'reviewedAt' | 'approvedBy' | 'approvedAt' | 'publishedAt'>>): Promise<EsgDisclosure | null> {
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
    if (patch.content !== undefined) set('content', patch.content);
    if (patch.summary !== undefined) set('summary', patch.summary);
    if (patch.pageReference !== undefined) set('page_reference', patch.pageReference);
    if (patch.linkedDocuments !== undefined) set('linked_documents', patch.linkedDocuments);
    if (patch.dataPoints !== undefined) set('data_points', patch.dataPoints);
    if (patch.assuranceStatus !== undefined) set('assurance_status', patch.assuranceStatus);
    if (patch.submittedBy !== undefined) set('submitted_by', patch.submittedBy);
    if (patch.submittedAt !== undefined) set('submitted_at', patch.submittedAt);
    if (patch.reviewedBy !== undefined) set('reviewed_by', patch.reviewedBy);
    if (patch.reviewedAt !== undefined) set('reviewed_at', patch.reviewedAt);
    if (patch.approvedBy !== undefined) set('approved_by', patch.approvedBy);
    if (patch.approvedAt !== undefined) set('approved_at', patch.approvedAt);
    if (patch.publishedAt !== undefined) set('published_at', patch.publishedAt);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgDisclosure>(
      `UPDATE esg_disclosures SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapDisclosure(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_disclosures SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
