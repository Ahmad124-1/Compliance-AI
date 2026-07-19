import { query } from '../db/pool.js';
import type { QueueJob, QueueJobPayload, QueueJobStatus } from '../types/index.js';

const mapQueueJob = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  queueName: row.queue_name,
  jobType: row.job_type,
  payload: row.payload,
  status: row.status,
  priority: row.priority,
  attempts: row.attempts,
  maxAttempts: row.max_attempts,
  lastError: row.last_error,
  scheduledAt: row.scheduled_at,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  failedAt: row.failed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const queueRepo = {
  async createJob(input: QueueJobPayload) {
    const { rows } = await query<QueueJob>(
      `INSERT INTO queue_jobs (organization_id, queue_name, job_type, payload, priority, max_attempts, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        null,
        input.queueName,
        input.jobType,
        JSON.stringify(input.payload ?? {}),
        input.priority ?? 0,
        input.maxAttempts ?? 3,
        input.scheduledAt ?? new Date(),
      ],
    );
    return mapQueueJob(rows[0]);
  },

  async findJobById(id: string) {
    const { rows } = await query(`SELECT * FROM queue_jobs WHERE id = $1`, [id]);
    return rows[0] ? mapQueueJob(rows[0]) : null;
  },

  async listByStatus(status: QueueJobStatus, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM queue_jobs WHERE status = $1 ORDER BY priority DESC, scheduled_at ASC LIMIT $2 OFFSET $3`,
      [status, limit, offset],
    );
    return rows.map(mapQueueJob);
  },

  async listByQueue(queueName: string, status?: QueueJobStatus, limit = 100, offset = 0) {
    if (status) {
      const { rows } = await query(
        `SELECT * FROM queue_jobs WHERE queue_name = $1 AND status = $2 ORDER BY priority DESC, scheduled_at ASC LIMIT $3 OFFSET $4`,
        [queueName, status, limit, offset],
      );
      return rows.map(mapQueueJob);
    }
    const { rows } = await query(
      `SELECT * FROM queue_jobs WHERE queue_name = $1 ORDER BY priority DESC, scheduled_at ASC LIMIT $2 OFFSET $3`,
      [queueName, limit, offset],
    );
    return rows.map(mapQueueJob);
  },

  async updateJobStatus(id: string, status: QueueJobStatus) {
    const sets: string[] = [`status = $1`];
    const params: unknown[] = [status];
    if (status === 'processing') { sets.push(`started_at = now()`); }
    else if (status === 'completed') { sets.push(`completed_at = now()`); }
    else if (status === 'failed') { sets.push(`failed_at = now()`); }
    const { rows } = await query(`UPDATE queue_jobs SET ${sets.join(', ')} WHERE id = $${sets.length + 1} RETURNING *`, [...params, id]);
    return rows[0] ? mapQueueJob(rows[0]) : null;
  },

  async incrementAttempts(id: string) {
    const { rows } = await query(`UPDATE queue_jobs SET attempts = attempts + 1, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapQueueJob(rows[0]) : null;
  },

  async markDeadLetter(id: string, lastError: string) {
    const { rows } = await query(`UPDATE queue_jobs SET status = 'dead_letter', last_error = $1, updated_at = now() WHERE id = $2 RETURNING *`, [lastError, id]);
    return rows[0] ? mapQueueJob(rows[0]) : null;
  },

  async listDeadLetter(limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM queue_jobs WHERE status = 'dead_letter' ORDER BY failed_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows.map(mapQueueJob);
  },

  async cleanupCompleted(olderThanDays = 7) {
    await query(`DELETE FROM queue_jobs WHERE status = 'completed' AND completed_at < now() - interval '${olderThanDays} days'`);
  },
};
