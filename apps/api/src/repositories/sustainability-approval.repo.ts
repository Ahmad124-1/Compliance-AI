import { query } from '../db/pool.js';
import type { SustainabilityApproval } from '../types/sustainability.js';

function mapApproval(row: any): SustainabilityApproval {
  return {
    id: row.id,
    organizationId: row.organization_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    submittedBy: row.submitted_by,
    reviewerId: row.reviewer_id,
    comments: row.comments,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const sustainabilityApprovalRepo = {
  async create(input: {
    organizationId: string;
    entityType: string;
    entityId: string;
    submittedBy?: string;
    dueDate?: string;
  }): Promise<SustainabilityApproval> {
    const { rows } = await query<SustainabilityApproval>(
      `INSERT INTO sustainability_approvals (organization_id, entity_type, entity_id, submitted_by, due_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        input.organizationId,
        input.entityType,
        input.entityId,
        input.submittedBy ?? null,
        input.dueDate ?? null,
      ],
    );
    return mapApproval(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<SustainabilityApproval | null> {
    const { rows } = await query<SustainabilityApproval>(
      `SELECT * FROM sustainability_approvals WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapApproval(rows[0]) : null;
  },

  async listByEntity(entityType: string, entityId: string, orgId: string): Promise<SustainabilityApproval[]> {
    const { rows } = await query<SustainabilityApproval>(
      `SELECT * FROM sustainability_approvals WHERE entity_type = $1 AND entity_id = $2 AND organization_id = $3 AND is_deleted = FALSE ORDER BY created_at DESC`,
      [entityType, entityId, orgId],
    );
    return rows.map(mapApproval);
  },

  async listByOrganization(orgId: string, filter?: { status?: string; entityType?: string }): Promise<SustainabilityApproval[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter?.status) {
      where.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter?.entityType) {
      where.push(`entity_type = $${i++}`);
      params.push(filter.entityType);
    }
    const { rows } = await query<SustainabilityApproval>(
      `SELECT * FROM sustainability_approvals WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapApproval);
  },

  async transition(id: string, orgId: string, status: string, reviewerId?: string, comments?: string): Promise<SustainabilityApproval | null> {
    const sets: string[] = ['status = $1'];
    const params: unknown[] = [status];
    let i = 2;
    if (reviewerId !== undefined) {
      sets.push(`reviewer_id = $${i++}`);
      params.push(reviewerId);
    }
    if (comments !== undefined) {
      sets.push(`comments = $${i++}`);
      params.push(comments);
    }
    sets.push('updated_at = now()');
    if (status === 'approved' || status === 'rejected') {
      sets.push('completed_at = now()');
    }
    params.push(id, orgId);
    const { rows } = await query<SustainabilityApproval>(
      `UPDATE sustainability_approvals SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapApproval(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE sustainability_approvals SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
