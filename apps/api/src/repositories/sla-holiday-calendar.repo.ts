import { query } from '../db/pool.js';

export const mapSlaHoliday = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  date: row.date,
  isRecurring: row.is_recurring,
  createdAt: row.created_at,
});

export const slaHolidayCalendarRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO sla_holiday_calendar (organization_id, name, date, is_recurring) VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.organizationId, input.name, input.date, input.isRecurring ?? false],
    );
    return mapSlaHoliday(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM sla_holiday_calendar WHERE id = $1`, [id]);
    return rows[0] ? mapSlaHoliday(rows[0]) : null;
  },

  async findByOrganization(orgId) {
    const { rows } = await query(`SELECT * FROM sla_holiday_calendar WHERE organization_id = $1 ORDER BY date ASC`, [orgId]);
    return rows.map(mapSlaHoliday);
  },

  async delete(id) {
    await query(`DELETE FROM sla_holiday_calendar WHERE id = $1`, [id]);
  },
};
