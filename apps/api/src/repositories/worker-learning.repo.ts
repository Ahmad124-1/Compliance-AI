import { query } from '../db/pool.js';
import type { WorkerLearning } from '../types/worker-platform.js';

function mapLearning(row: any): WorkerLearning {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    courseId: row.course_id,
    courseTitle: row.course_title,
    learningType: row.learning_type,
    status: row.status,
    progress: row.progress,
    score: row.score,
    certificateUrl: row.certificate_url,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const workerLearningRepo = {
  async findByUserId(orgId: string, userId: string): Promise<WorkerLearning[]> {
    const { rows } = await query(`SELECT * FROM worker_learning WHERE organization_id = $1 AND user_id = $2 ORDER BY due_date ASC NULLS LAST, created_at DESC`, [orgId, userId]);
    return rows.map(mapLearning);
  },

  async findById(orgId: string, id: string): Promise<WorkerLearning | null> {
    const { rows } = await query(`SELECT * FROM worker_learning WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapLearning(rows[0]) : null;
  },

  async create(input: Partial<WorkerLearning> & { organizationId: string; userId: string; courseTitle: string }): Promise<WorkerLearning> {
    const { rows } = await query<WorkerLearning>(
      `INSERT INTO worker_learning (organization_id, user_id, course_id, course_title, learning_type, status, progress, score, certificate_url, due_date, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        input.organizationId,
        input.userId,
        input.courseId ?? null,
        input.courseTitle,
        input.learningType ?? 'course',
        input.status ?? 'not_started',
        input.progress ?? 0,
        input.score ?? null,
        input.certificateUrl ?? null,
        input.dueDate ?? null,
        input.metadata ?? {},
      ],
    );
    return mapLearning(rows[0]);
  },

  async updateStatus(orgId: string, id: string, status: string, progress?: number, score?: number | null): Promise<WorkerLearning | null> {
    const { rows } = await query<WorkerLearning>(
      `UPDATE worker_learning SET status = $1, progress = $2, score = $3, completed_at = $4, updated_at = now() WHERE organization_id = $5 AND id = $6 RETURNING *`,
      [status, progress ?? 0, score ?? null, status === 'completed' || status === 'certified' ? new Date() : null, orgId, id],
    );
    return rows[0] ? mapLearning(rows[0]) : null;
  },
};
