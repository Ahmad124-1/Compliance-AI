import { query } from '../db/pool.js';
import type { WorkerForm } from '../types/worker-platform.js';

function mapForm(row: any): WorkerForm {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    formType: row.form_type,
    title: row.title,
    data: row.data ?? {},
    status: row.status,
    reviewedById: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const workerFormRepo = {
  async findByUserId(orgId: string, userId: string): Promise<WorkerForm[]> {
    const { rows } = await query(`SELECT * FROM worker_forms WHERE organization_id = $1 AND user_id = $2 ORDER BY created_at DESC`, [orgId, userId]);
    return rows.map(mapForm);
  },

  async findById(orgId: string, id: string): Promise<WorkerForm | null> {
    const { rows } = await query(`SELECT * FROM worker_forms WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapForm(rows[0]) : null;
  },

  async create(input: Partial<WorkerForm> & { organizationId: string; userId: string; title: string; formType: string; data: Record<string, unknown> }): Promise<WorkerForm> {
    const { rows } = await query<WorkerForm>(
      `INSERT INTO worker_forms (organization_id, user_id, form_type, title, data, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.organizationId, input.userId, input.formType, input.title, input.data, input.status ?? 'pending'],
    );
    return mapForm(rows[0]);
  },

  async updateStatus(orgId: string, id: string, status: string, reviewedById?: string | null, notes?: string | null): Promise<WorkerForm | null> {
    const { rows } = await query<WorkerForm>(
      `UPDATE worker_forms SET status = $1, reviewed_by = $2, reviewed_at = $3, notes = $4, updated_at = now() WHERE organization_id = $5 AND id = $6 RETURNING *`,
      [status, reviewedById ?? null, status !== 'pending' ? new Date() : null, notes ?? null, orgId, id],
    );
    return rows[0] ? mapForm(rows[0]) : null;
  },
};
