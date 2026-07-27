import { query } from '../db/pool.js';
import type { EsgAssurance } from '../types/esg.js';

function mapAssurance(row: any): EsgAssurance {
  return {
    id: row.id,
    organizationId: row.organization_id,
    reportId: row.report_id,
    disclosureId: row.disclosure_id,
    assuranceType: row.assurance_type,
    scopeDescription: row.scope_description,
    providerName: row.provider_name,
    providerEmail: row.provider_email,
    assuranceDate: row.assurance_date,
    status: row.status,
    findings: row.findings ?? [],
    conclusion: row.conclusion,
    opinionType: row.opinion_type,
    evidenceReferences: row.evidence_references ?? [],
    assignedTo: row.assigned_to,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface AssuranceFilter {
  reportId?: string;
  disclosureId?: string;
  assuranceType?: string;
  status?: string;
}

export const esgAssuranceRepo = {
  async create(input: {
    organizationId: string;
    reportId?: string;
    disclosureId?: string;
    assuranceType: string;
    scopeDescription: string;
    providerName?: string;
    providerEmail?: string;
    assuranceDate?: string;
    assignedTo?: string;
  }): Promise<EsgAssurance> {
    const { rows } = await query<EsgAssurance>(
      `INSERT INTO esg_assurance (organization_id, report_id, disclosure_id, assurance_type, scope_description, provider_name, provider_email, assurance_date, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.organizationId,
        input.reportId ?? null,
        input.disclosureId ?? null,
        input.assuranceType,
        input.scopeDescription,
        input.providerName ?? null,
        input.providerEmail ?? null,
        input.assuranceDate ?? null,
        input.assignedTo ?? null,
      ],
    );
    return mapAssurance(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgAssurance | null> {
    const { rows } = await query<EsgAssurance>(
      `SELECT * FROM esg_assurance WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapAssurance(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: AssuranceFilter = {}): Promise<EsgAssurance[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.reportId) {
      where.push(`report_id = $${i++}`);
      params.push(filter.reportId);
    }
    if (filter.disclosureId) {
      where.push(`disclosure_id = $${i++}`);
      params.push(filter.disclosureId);
    }
    if (filter.assuranceType) {
      where.push(`assurance_type = $${i++}`);
      params.push(filter.assuranceType);
    }
    if (filter.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    const { rows } = await query<EsgAssurance>(
      `SELECT * FROM esg_assurance WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapAssurance);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgAssurance, 'status' | 'findings' | 'conclusion' | 'opinionType' | 'assuranceDate' | 'evidenceReferences'>>): Promise<EsgAssurance | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.findings !== undefined) set('findings', patch.findings);
    if (patch.conclusion !== undefined) set('conclusion', patch.conclusion);
    if (patch.opinionType !== undefined) set('opinion_type', patch.opinionType);
    if (patch.assuranceDate !== undefined) set('assurance_date', patch.assuranceDate);
    if (patch.evidenceReferences !== undefined) set('evidence_references', patch.evidenceReferences);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgAssurance>(
      `UPDATE esg_assurance SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapAssurance(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_assurance SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
