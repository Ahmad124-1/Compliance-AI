import { query } from '../db/pool.js';

export const mapSlaInstance = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  caseId: row.case_id,
  slaDefinitionId: row.sla_definition_id,
  slaType: row.sla_type,
  status: row.status,
  startedAt: row.started_at,
  pausedAt: row.paused_at,
  resumedAt: row.resumed_at,
  deadline: row.deadline,
  metAt: row.met_at,
  breachedAt: row.breached_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const slaInstanceRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO sla_instances (organization_id, case_id, sla_definition_id, sla_type, deadline)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.caseId, input.slaDefinitionId, input.slaType, input.deadline],
    );
    return mapSlaInstance(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM sla_instances WHERE id = $1`, [id]);
    return rows[0] ? mapSlaInstance(rows[0]) : null;
  },

  async findByCase(orgId, caseId) {
    const { rows } = await query(`SELECT * FROM sla_instances WHERE organization_id = $1 AND case_id = $2 ORDER BY created_at DESC`, [orgId, caseId]);
    return rows.map(mapSlaInstance);
  },

  async findActiveByCase(caseId) {
    const { rows } = await query(`SELECT * FROM sla_instances WHERE case_id = $1 AND status = 'active' ORDER BY created_at ASC`, [caseId]);
    return rows.map(mapSlaInstance);
  },

  async updateStatus(id, status) {
    const updates = [`status = $1`, `updated_at = now()`];
    const params = [status];
    if (status === 'paused') updates.push(`paused_at = now()`);
    if (status === 'met') updates.push(`met_at = now()`);
    if (status === 'breached') updates.push(`breached_at = now()`);
    if (status === 'active') updates.push(`resumed_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE sla_instances SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`, params);
    return rows[0] ? mapSlaInstance(rows[0]) : null;
  },

  async updateDeadline(id, deadline) {
    const { rows } = await query(`UPDATE sla_instances SET deadline = $1, updated_at = now() WHERE id = $2 RETURNING *`, [deadline, id]);
    return rows[0] ? mapSlaInstance(rows[0]) : null;
  },

  async listBreached(orgId) {
    const { rows } = await query(
      `SELECT * FROM sla_instances WHERE organization_id = $1 AND status = 'active' AND deadline < now()`,
      [orgId],
    );
    return rows.map(mapSlaInstance);
  },

  async listByFilters(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;

    if (filters.slaType) { conditions.push(`sla_type = $${i++}`); params.push(filters.slaType); }
    if (filters.status) { conditions.push(`status = $${i++}`); params.push(filters.status); }
    if (filters.caseId) { conditions.push(`case_id = $${i++}`); params.push(filters.caseId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM sla_instances ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapSlaInstance);
  },

  async findByOrganization(orgId: string) {
    return this.listByFilters(orgId);
  },

  async getStats(orgId) {
    const { rows } = await query(
      `SELECT sla_type, status, COUNT(*) AS count, AVG(EXTRACT(EPOCH FROM (deadline - started_at)) / 60) AS avg_duration_minutes
       FROM sla_instances WHERE organization_id = $1
       GROUP BY sla_type, status`,
      [orgId],
    );
    return rows.map((r) => ({
      slaType: r.sla_type,
      status: r.status,
      count: parseInt(r.count, 10),
      avgDurationMinutes: r.avg_duration_minutes ? parseFloat(r.avg_duration_minutes) : null,
    }));
  },
};
