import { query } from '../db/pool.js';
import type { InitiativeMilestone } from '../types/sustainability.js';

function mapMilestone(row: any): InitiativeMilestone {
  return {
    id: row.id,
    organizationId: row.organization_id,
    initiativeId: row.initiative_id,
    name: row.name,
    description: row.description,
    dueDate: row.due_date,
    completionDate: row.completion_date,
    status: row.status,
    ownerId: row.owner_id,
    evidenceCount: parseInt(row.evidence_count, 10) ?? 0,
    sortOrder: parseInt(row.sort_order, 10) ?? 0,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const initiativeMilestoneRepo = {
  async create(input: {
    organizationId: string;
    initiativeId: string;
    name: string;
    description?: string;
    dueDate?: string;
    ownerId?: string;
    sortOrder?: number;
  }): Promise<InitiativeMilestone> {
    const { rows } = await query<InitiativeMilestone>(
      `INSERT INTO initiative_milestones (organization_id, initiative_id, name, description, due_date, owner_id, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId,
        input.initiativeId,
        input.name,
        input.description ?? null,
        input.dueDate ?? null,
        input.ownerId ?? null,
        input.sortOrder ?? 0,
      ],
    );
    return mapMilestone(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<InitiativeMilestone | null> {
    const { rows } = await query<InitiativeMilestone>(
      `SELECT * FROM initiative_milestones WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapMilestone(rows[0]) : null;
  },

  async listByInitiative(initiativeId: string, orgId: string): Promise<InitiativeMilestone[]> {
    const { rows } = await query<InitiativeMilestone>(
      `SELECT * FROM initiative_milestones WHERE initiative_id = $1 AND organization_id = $2 AND is_deleted = FALSE ORDER BY sort_order, due_date`,
      [initiativeId, orgId],
    );
    return rows.map(mapMilestone);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<InitiativeMilestone, 'name' | 'description' | 'dueDate' | 'completionDate' | 'status' | 'ownerId' | 'sortOrder'>>): Promise<InitiativeMilestone | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.dueDate !== undefined) set('due_date', patch.dueDate);
    if (patch.completionDate !== undefined) set('completion_date', patch.completionDate);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.ownerId !== undefined) set('owner_id', patch.ownerId);
    if (patch.sortOrder !== undefined) set('sort_order', patch.sortOrder);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<InitiativeMilestone>(
      `UPDATE initiative_milestones SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapMilestone(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE initiative_milestones SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};

