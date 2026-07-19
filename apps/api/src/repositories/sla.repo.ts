import { query } from '../db/pool.js';

const mapSlaDefinition = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  description: row.description,
  slaType: row.sla_type,
  priority: row.priority,
  severity: row.severity,
  category: row.category,
  targetDurationMinutes: row.target_duration_minutes,
  isActive: row.is_active,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSlaInstance = (row) => ({
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

const mapSlaPauseHistory = (row) => ({
  id: row.id,
  slaInstanceId: row.sla_instance_id,
  reason: row.reason,
  pausedAt: row.paused_at,
  resumedAt: row.resumed_at,
  createdAt: row.created_at,
});

const mapSlaWorkingHours = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  dayOfWeek: row.day_of_week,
  startTime: row.start_time,
  endTime: row.end_time,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSlaHolidayCalendar = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  date: row.date,
  isRecurring: row.is_recurring,
  createdAt: row.created_at,
});

export const slaRepo = {
  async createDefinition(input) {
    const { rows } = await query(
      `INSERT INTO sla_definitions (organization_id, name, description, sla_type, priority, severity, category, target_duration_minutes, is_active, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.slaType,
        input.priority,
        input.severity ?? null,
        input.category ?? null,
        input.targetDurationMinutes,
        input.isActive ?? true,
        input.isDefault ?? false,
      ],
    );
    return mapSlaDefinition(rows[0]);
  },

  async findDefinitionById(id) {
    const { rows } = await query(`SELECT * FROM sla_definitions WHERE id = $1`, [id]);
    return rows[0] ? mapSlaDefinition(rows[0]) : null;
  },

  async listDefinitionsByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM sla_definitions WHERE organization_id = $1 ORDER BY priority, created_at DESC`, [orgId]);
    return rows.map(mapSlaDefinition);
  },

  async updateDefinition(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.slaType !== undefined) set('sla_type', patch.slaType);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.severity !== undefined) set('severity', patch.severity);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.targetDurationMinutes !== undefined) set('target_duration_minutes', patch.targetDurationMinutes);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (patch.isDefault !== undefined) set('is_default', patch.isDefault);
    if (!sets.length) return this.findDefinitionById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE sla_definitions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapSlaDefinition(rows[0]) : null;
  },

  async deleteDefinition(id) {
    await query(`DELETE FROM sla_definitions WHERE id = $1`, [id]);
  },

  async createInstance(input) {
    const { rows } = await query(
      `INSERT INTO sla_instances (organization_id, case_id, sla_definition_id, sla_type, started_at, deadline)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.organizationId, input.caseId, input.slaDefinitionId, input.slaType, input.startedAt ?? new Date(), input.deadline],
    );
    return mapSlaInstance(rows[0]);
  },

  async findInstanceById(id) {
    const { rows } = await query(`SELECT * FROM sla_instances WHERE id = $1`, [id]);
    return rows[0] ? mapSlaInstance(rows[0]) : null;
  },

  async listInstancesByCase(caseId) {
    const { rows } = await query(`SELECT * FROM sla_instances WHERE case_id = $1 ORDER BY created_at DESC`, [caseId]);
    return rows.map(mapSlaInstance);
  },

  async updateInstance(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.pausedAt !== undefined) set('paused_at', patch.pausedAt);
    if (patch.resumedAt !== undefined) set('resumed_at', patch.resumedAt);
    if (patch.deadline !== undefined) set('deadline', patch.deadline);
    if (patch.metAt !== undefined) set('met_at', patch.metAt);
    if (patch.breachedAt !== undefined) set('breached_at', patch.breachedAt);
    if (!sets.length) return this.findInstanceById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE sla_instances SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapSlaInstance(rows[0]) : null;
  },

  async listActiveInstances(orgId) {
    const { rows } = await query(
      `SELECT * FROM sla_instances WHERE organization_id = $1 AND status = 'active' ORDER BY deadline ASC`,
      [orgId],
    );
    return rows.map(mapSlaInstance);
  },

  async createPauseHistory(input) {
    const { rows } = await query(
      `INSERT INTO sla_pause_history (sla_instance_id, reason, paused_at) VALUES ($1, $2, $3) RETURNING *`,
      [input.slaInstanceId, input.reason, input.pausedAt ?? new Date()],
    );
    return mapSlaPauseHistory(rows[0]);
  },

  async listPauseHistory(slaInstanceId) {
    const { rows } = await query(`SELECT * FROM sla_pause_history WHERE sla_instance_id = $1 ORDER BY paused_at DESC`, [slaInstanceId]);
    return rows.map(mapSlaPauseHistory);
  },

  async createWorkingHours(input) {
    const { rows } = await query(
      `INSERT INTO sla_working_hours (organization_id, day_of_week, start_time, end_time, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.dayOfWeek, input.startTime, input.endTime, input.isActive ?? true],
    );
    return mapSlaWorkingHours(rows[0]);
  },

  async listWorkingHoursByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM sla_working_hours WHERE organization_id = $1 ORDER BY day_of_week`, [orgId]);
    return rows.map(mapSlaWorkingHours);
  },

  async upsertWorkingHours(input) {
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

  async createHoliday(input) {
    const { rows } = await query(
      `INSERT INTO sla_holiday_calendar (organization_id, name, date, is_recurring)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.organizationId, input.name, input.date, input.isRecurring ?? false],
    );
    return mapSlaHolidayCalendar(rows[0]);
  },

  async listHolidaysByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM sla_holiday_calendar WHERE organization_id = $1 ORDER BY date DESC`, [orgId]);
    return rows.map(mapSlaHolidayCalendar);
  },

  async deleteHoliday(id) {
    await query(`DELETE FROM sla_holiday_calendar WHERE id = $1`, [id]);
  },
};
