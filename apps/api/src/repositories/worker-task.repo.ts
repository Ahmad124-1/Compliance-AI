import { query } from '../db/pool.js';
import type { WorkerTask } from '../types/worker-platform.js';

function mapTask(row: any): WorkerTask {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    taskType: row.task_type,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    attachments: row.attachments ?? [],
    metadata: row.metadata ?? {},
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const workerTaskRepo = {
  async findByUserId(orgId: string, userId: string): Promise<WorkerTask[]> {
    const { rows } = await query(`SELECT * FROM worker_tasks WHERE organization_id = $1 AND user_id = $2 ORDER BY due_date ASC NULLS LAST, created_at DESC`, [orgId, userId]);
    return rows.map(mapTask);
  },

  async findById(orgId: string, id: string): Promise<WorkerTask | null> {
    const { rows } = await query(`SELECT * FROM worker_tasks WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapTask(rows[0]) : null;
  },

  async create(input: Partial<WorkerTask> & { organizationId: string; userId: string; title: string }): Promise<WorkerTask> {
    const { rows } = await query<WorkerTask>(
      `INSERT INTO worker_tasks (organization_id, user_id, title, description, task_type, status, priority, due_date, related_entity_type, related_entity_id, attachments, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.title,
        input.description ?? null,
        input.taskType ?? 'task',
        input.status ?? 'pending',
        input.priority ?? 'medium',
        input.dueDate ?? null,
        input.relatedEntityType ?? null,
        input.relatedEntityId ?? null,
        input.attachments ?? [],
        input.metadata ?? {},
      ],
    );
    return mapTask(rows[0]);
  },

  async updateStatus(orgId: string, id: string, status: string, completedAt?: string): Promise<WorkerTask | null> {
    const { rows } = await query<WorkerTask>(`UPDATE worker_tasks SET status = $1, completed_at = $2, updated_at = now() WHERE organization_id = $3 AND id = $4 RETURNING *`, [status, completedAt ?? (status === 'completed' ? 'now()' : null), orgId, id]);
    return rows[0] ? mapTask(rows[0]) : null;
  },
};
