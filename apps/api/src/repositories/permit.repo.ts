import { query } from '../db/pool.js';
import type { Permit, PermitType, PermitStatus } from '../types/environment.js';

function mapPermit(row: any): Permit {
  return {
    id: row.id,
    organizationId: row.organization_id,
    facilityId: row.facility_id,
    siteId: row.site_id,
    permitType: row.permit_type,
    permitNumber: row.permit_number,
    issuingAuthority: row.issuing_authority,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    renewalDate: row.renewal_date,
    status: row.status,
    conditions: row.conditions,
    supportingDocuments: Array.isArray(row.supporting_documents) ? row.supporting_documents : [],
    approvalHistory: Array.isArray(row.approval_history) ? row.approval_history : [],
    responsiblePersonId: row.responsible_person_id,
    notes: row.notes,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface PermitFilter {
  facilityId?: string;
  siteId?: string;
  permitType?: PermitType;
  status?: PermitStatus;
  expiringSoon?: boolean;
}

export const permitRepo = {
  async create(input: {
    organizationId: string;
    facilityId?: string | null;
    siteId?: string | null;
    permitType: PermitType;
    permitNumber: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string;
    renewalDate?: string | null;
    status?: PermitStatus;
    conditions?: string | null;
    supportingDocuments?: string[];
    approvalHistory?: Record<string, unknown>[];
    responsiblePersonId?: string | null;
    notes?: string | null;
  }): Promise<Permit> {
    const { rows } = await query<Permit>(
      `INSERT INTO permits (organization_id, facility_id, site_id, permit_type, permit_number, issuing_authority, issue_date, expiry_date, renewal_date, status, conditions, supporting_documents, approval_history, responsible_person_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        input.organizationId,
        input.facilityId ?? null,
        input.siteId ?? null,
        input.permitType,
        input.permitNumber,
        input.issuingAuthority,
        input.issueDate,
        input.expiryDate,
        input.renewalDate ?? null,
        input.status ?? 'active',
        input.conditions ?? null,
        input.supportingDocuments ?? [],
        input.approvalHistory ?? [],
        input.responsiblePersonId ?? null,
        input.notes ?? null,
      ],
    );
    return mapPermit(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<Permit | null> {
    const { rows } = await query<Permit>(
      `SELECT * FROM permits WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapPermit(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: PermitFilter = {}): Promise<Permit[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.facilityId) { where.push(`facility_id = $${i++}`); params.push(filter.facilityId); }
    if (filter.siteId) { where.push(`site_id = $${i++}`); params.push(filter.siteId); }
    if (filter.permitType) { where.push(`permit_type = $${i++}`); params.push(filter.permitType); }
    if (filter.status) { where.push(`status = $${i++}`); params.push(filter.status); }
    if (filter.expiringSoon) { where.push(`expiry_date <= now() + interval '30 days' AND expiry_date >= now()`); }
    const orderBy = filter.expiringSoon ? 'expiry_date ASC' : 'created_at DESC';
    const { rows } = await query<Permit>(
      `SELECT * FROM permits WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`,
      params,
    );
    return rows.map(mapPermit);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<Permit, 'permitType' | 'permitNumber' | 'issuingAuthority' | 'issueDate' | 'expiryDate' | 'renewalDate' | 'status' | 'conditions' | 'supportingDocuments' | 'approvalHistory' | 'responsiblePersonId' | 'notes'>>): Promise<Permit | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.permitType !== undefined) set('permit_type', patch.permitType);
    if (patch.permitNumber !== undefined) set('permit_number', patch.permitNumber);
    if (patch.issuingAuthority !== undefined) set('issuing_authority', patch.issuingAuthority);
    if (patch.issueDate !== undefined) set('issue_date', patch.issueDate);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.renewalDate !== undefined) set('renewal_date', patch.renewalDate);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.conditions !== undefined) set('conditions', patch.conditions);
    if (patch.supportingDocuments !== undefined) set('supporting_documents', patch.supportingDocuments);
    if (patch.approvalHistory !== undefined) set('approval_history', patch.approvalHistory);
    if (patch.responsiblePersonId !== undefined) set('responsible_person_id', patch.responsiblePersonId);
    if (patch.notes !== undefined) set('notes', patch.notes);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<Permit>(
      `UPDATE permits SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapPermit(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE permits SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
