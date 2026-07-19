import { query } from '../db/pool.js';

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
