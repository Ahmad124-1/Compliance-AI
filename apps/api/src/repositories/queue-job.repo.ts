import { query } from '../db/pool.js';

export const mapQueueJob = (row) => ({
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

export const queueJobRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO queue_jobs (organization_id, queue_name, job_type, payload, priority, max_attempts, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.organizationId ?? null,
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

  async findById(id) {
    const { rows } = await query(`SELECT * FROM queue_jobs WHERE id = $1`, [id]);
    return rows[0] ? mapQueueJob(rows[0]) : null;
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };

    if (patch.status !== undefined) set('status', patch.status);
    if (patch.attempts !== undefined) set('attempts', patch.attempts);
    if (patch.lastError !== undefined) set('last_error', patch.lastError);
    if (patch.startedAt !== undefined) set('started_at', patch.startedAt);
    if (patch.completedAt !== undefined) set('completed_at', patch.completedAt);
    if (patch.failedAt !== undefined) set('failed_at', patch.failedAt);
    if (!sets.length) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Queue job not found');
      return existing;
    }
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE queue_jobs SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    if (!rows[0]) throw new Error('Queue job not found after update');
    return mapQueueJob(rows[0]);
  },

  async list(filters: any = {}) {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters.queueName) { conditions.push(`queue_name = $${i++}`); params.push(filters.queueName); }
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.jobType) { conditions.push(`job_type = $${i++}`); params.push(filters.jobType); }
    if (filters.organizationId) { conditions.push(`organization_id = $${i++}`); params.push(filters.organizationId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const dataParams = [...params, limit, offset];

    const { rows } = await query(`SELECT * FROM queue_jobs ${where} ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i++}`, dataParams);
    return rows.map(mapQueueJob);
  },

  async findOldestPending(queueName, limit = 10) {
    const { rows } = await query(
      `SELECT * FROM queue_jobs WHERE queue_name = $1 AND status = 'pending' ORDER BY scheduled_at ASC LIMIT $2`,
      [queueName, limit],
    );
    return rows.map(mapQueueJob);
  },

  async listDeadLetters(orgId, limit = 50) {
    const { rows } = await query(
      `SELECT * FROM queue_jobs WHERE organization_id = $1 AND status = 'dead_letter' ORDER BY created_at DESC LIMIT $2`,
      [orgId, limit],
    );
    return rows.map(mapQueueJob);
  },

  async getStats(queueName) {
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (queueName) { conditions.push(`queue_name = $${i++}`); params.push(queueName); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT status, COUNT(*) AS count FROM queue_jobs ${where} GROUP BY status`,
      params,
    );
    return rows.reduce((acc, r) => { acc[r.status] = parseInt(r.count, 10); return acc; }, {});
  },

  async cleanupCompleted(olderThan) {
    const { rows } = await query(
      `DELETE FROM queue_jobs WHERE status IN ('completed', 'cancelled') AND updated_at < $1 RETURNING id`,
      [olderThan],
    );
    return rows.map((r) => r.id);
  },
};
