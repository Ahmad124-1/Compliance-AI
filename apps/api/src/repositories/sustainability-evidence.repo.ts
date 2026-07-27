import { query } from '../db/pool.js';
import type { SustainabilityEvidence } from '../types/sustainability.js';

function mapEvidence(row: any): SustainabilityEvidence {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    documentId: row.document_id,
    title: row.title,
    description: row.description,
    evidenceType: row.evidence_type,
    tags: row.tags ?? [],
    version: parseInt(row.version, 10) ?? 1,
    expiryDate: row.expiry_date,
    approvalStatus: row.approval_status,
    uploadedBy: row.uploaded_by,
    aiExtractedData: row.ai_extracted_data ?? {},
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EvidenceFilter {
  entityType?: string;
  entityId?: string;
  evidenceType?: string;
  approvalStatus?: string;
}

export const sustainabilityEvidenceRepo = {
  async create(input: {
    organizationId: string;
    entityType: string;
    entityId: string;
    documentId?: string;
    title: string;
    description?: string;
    evidenceType: string;
    tags?: string[];
    version?: number;
    expiryDate?: string;
    uploadedBy?: string;
    aiExtractedData?: Record<string, unknown>;
  }): Promise<SustainabilityEvidence> {
    const { rows } = await query<SustainabilityEvidence>(
      `INSERT INTO sustainability_evidence (organization_id, entity_type, entity_id, document_id, title, description, evidence_type, tags, version, expiry_date, uploaded_by, ai_extracted_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        input.organizationId,
        input.entityType,
        input.entityId,
        input.documentId ?? null,
        input.title,
        input.description ?? null,
        input.evidenceType,
        input.tags ?? [],
        input.version ?? 1,
        input.expiryDate ?? null,
        input.uploadedBy ?? null,
        input.aiExtractedData ?? {},
      ],
    );
    return mapEvidence(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityEvidence | null> {
    const { rows } = await query<SustainabilityEvidence>(
      `SELECT * FROM sustainability_evidence WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEvidence(rows[0]) : null;
  },

  async listByEntity(entityType: string, entityId: string, orgId: string): Promise<SustainabilityEvidence[]> {
    const { rows } = await query<SustainabilityEvidence>(
      `SELECT * FROM sustainability_evidence WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3 AND is_deleted = FALSE ORDER BY created_at DESC`,
      [entityType, entityId, orgId],
    );
    return rows.map(mapEvidence);
  },

  async listByOrganization(orgId: string, filter: EvidenceFilter = {}): Promise<SustainabilityEvidence[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.entityType) {
      where.push(`entity_type = $${i++}`);
      params.push(filter.entityType);
    }
    if (filter.entityId) {
      where.push(`entity_id = $${i++}`);
      params.push(filter.entityId);
    }
    if (filter.evidenceType) {
      where.push(`evidence_type = $${i++}`);
      params.push(filter.evidenceType);
    }
    if (filter.approvalStatus) {
      where.push(`approval_status = $${i++}`);
      params.push(filter.approvalStatus);
    }
    const { rows } = await query<SustainabilityEvidence>(
      `SELECT * FROM sustainability_evidence WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEvidence);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<SustainabilityEvidence, 'title' | 'description' | 'tags' | 'expiryDate' | 'approvalStatus' | 'aiExtractedData'>>): Promise<SustainabilityEvidence | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.tags !== undefined) set('tags', patch.tags);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.approvalStatus !== undefined) set('approval_status', patch.approvalStatus);
    if (patch.aiExtractedData !== undefined) set('ai_extracted_data', patch.aiExtractedData);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<SustainabilityEvidence>(
      `UPDATE sustainability_evidence SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEvidence(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_evidence SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

