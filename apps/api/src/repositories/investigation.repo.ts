import { query } from '../db/pool.js';

/** @type {any} */
const mapInvestigation = (row) => ({
  id: row.id,
  caseId: row.case_id,
  leadInvestigator: row.lead_investigator,
  status: row.status,
  scope: row.scope,
  methodology: row.methodology,
  findingsSummary: row.findings_summary,
  conclusion: row.conclusion,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** @type {any} */
const mapAssignment = (row) => ({
  id: row.id,
  investigationId: row.investigation_id,
  investigatorId: row.investigator_id,
  assignedBy: row.assigned_by,
  role: row.role,
  notes: row.notes,
  assignedAt: row.assigned_at,
  unassignedAt: row.unassigned_at,
});

/** @type {any} */
const mapTimelineEvent = (row) => ({
  id: row.id,
  investigationId: row.investigation_id,
  actorId: row.actor_id,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  description: row.description,
  metadata: row.metadata,
  createdAt: row.created_at,
});

export const investigationRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO investigations (case_id, lead_investigator, status, scope, methodology, findings_summary, conclusion)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.caseId,
        input.leadInvestigator ?? null,
        input.status ?? 'not_started',
        input.scope ?? null,
        input.methodology ?? null,
        input.findingsSummary ?? null,
        input.conclusion ?? null,
      ],
    );
    return mapInvestigation(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM investigations WHERE id = $1`, [id]);
    return rows[0] ? mapInvestigation(rows[0]) : null;
  },

  async findByCaseId(caseId) {
    const { rows } = await query(`SELECT * FROM investigations WHERE case_id = $1`, [caseId]);
    return rows[0] ? mapInvestigation(rows[0]) : null;
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.leadInvestigator !== undefined) set('lead_investigator', patch.leadInvestigator);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.scope !== undefined) set('scope', patch.scope);
    if (patch.methodology !== undefined) set('methodology', patch.methodology);
    if (patch.findingsSummary !== undefined) set('findings_summary', patch.findingsSummary);
    if (patch.conclusion !== undefined) set('conclusion', patch.conclusion);
    if (patch.startedAt !== undefined) set('started_at', patch.startedAt);
    if (patch.completedAt !== undefined) set('completed_at', patch.completedAt);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE investigations SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapInvestigation(rows[0]) : null;
  },

  async listByOrganization(orgId, filters: any = {}) {
    const conditions = ['c.organization_id = $1'];
    const params = [orgId];
    let i = 2;
    if (filters.status) { conditions.push(`i.status = $${i++}`); params.push(filters.status); }
    if (filters.caseId) { conditions.push(`i.case_id = $${i++}`); params.push(filters.caseId); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const sortBy = filters.sortBy ?? 'i.created_at';
    const sortOrder = filters.sortOrder ?? 'DESC';

    const countResult = await query(`SELECT COUNT(*) FROM investigations i JOIN cases c ON c.id = i.case_id ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const { rows } = await query(`SELECT i.* FROM investigations i JOIN cases c ON c.id = i.case_id ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT $${i++} OFFSET $${i++}`, [...params, limit, offset]);
    return { investigations: rows.map(mapInvestigation), total };
  },
};

export const investigationAssignmentRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO investigation_assignments (investigation_id, investigator_id, assigned_by, role, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.investigationId, input.investigatorId, input.assignedBy ?? null, input.role ?? 'investigator', input.notes ?? null],
    );
    return mapAssignment(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM investigation_assignments WHERE id = $1`, [id]);
    return rows[0] ? mapAssignment(rows[0]) : null;
  },

  async findByInvestigationId(investigationId) {
    const { rows } = await query(`SELECT * FROM investigation_assignments WHERE investigation_id = $1 AND unassigned_at IS NULL`, [investigationId]);
    return rows.map(mapAssignment);
  },

  async findByInvestigatorId(investigatorId) {
    const { rows } = await query(`SELECT * FROM investigation_assignments WHERE investigator_id = $1 AND unassigned_at IS NULL`, [investigatorId]);
    return rows.map(mapAssignment);
  },

  async unassign(id) {
    await query(`UPDATE investigation_assignments SET unassigned_at = now() WHERE id = $1`, [id]);
  },

  async listByInvestigation(investigationId) {
    const { rows } = await query(`SELECT * FROM investigation_assignments WHERE investigation_id = $1 ORDER BY assigned_at DESC`, [investigationId]);
    return rows.map(mapAssignment);
  },

  async isAssigned(investigationId, investigatorId) {
    const { rows } = await query(
      `SELECT * FROM investigation_assignments WHERE investigation_id = $1 AND investigator_id = $2 AND unassigned_at IS NULL`,
      [investigationId, investigatorId],
    );
    return rows.length > 0;
  },
};

export const investigationTimelineRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO investigation_timeline (investigation_id, actor_id, action, entity_type, entity_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        input.investigationId,
        input.actorId ?? null,
        input.action,
        input.entityType ?? null,
        input.entityId ?? null,
        input.description,
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapTimelineEvent(rows[0]);
  },

  async listByInvestigation(investigationId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM investigation_timeline WHERE investigation_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [investigationId, limit, offset],
    );
    return rows.map(mapTimelineEvent);
  },

  async listByActor(actorId) {
    const { rows } = await query(
      `SELECT * FROM investigation_timeline WHERE actor_id = $1 ORDER BY created_at DESC`,
      [actorId],
    );
    return rows.map(mapTimelineEvent);
  },
};
