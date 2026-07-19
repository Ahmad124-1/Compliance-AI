import { query } from '../db/pool.js';

export const mapSlaWorkingHours = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time,
  endTime: row.end_time,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const slaWorkingHoursRepo = {
  async upsert(input) {
    const { rows } = await query(
      `INSERT INTO sla_working_hours (organization_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, day_of_week)
       DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_active = EXCLUDED.is_active, updated_at = now()
       RETURNING *`,
      [input.organizationId, input.dayOfWeek, input.startTime, input.endTime, input.isActive ?? true],
    );
    return mapSlaWorkingHours(rows[0]);
  },

  async findByOrganization(orgId) {
    const { rows } = await query(`SELECT * FROM sla_working_hours WHERE organization_id = $1 ORDER BY day_of_week ASC`, [orgId]);
    return rows.map(mapSlaWorkingHours);
  },
};
