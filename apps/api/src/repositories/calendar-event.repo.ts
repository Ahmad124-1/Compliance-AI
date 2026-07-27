import { query } from '../db/pool.js';

function mapCalendarEvent(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    priority: row.priority,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    timezone: row.timezone,
    recurrenceRule: row.recurrence_rule,
    scope: row.scope ?? {},
    reminderMinutes: row.reminder_minutes ?? [],
    channels: row.channels ?? [],
    metadata: row.metadata ?? {},
    createdById: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEventAttendee(row: any) {
  return {
    id: row.id,
    calendarEventId: row.calendar_event_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    status: row.status,
    responseAt: row.response_at,
    checkedInAt: row.checked_in_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const calendarEventRepo = {
  async create(input: {
    organizationId: string;
    title: string;
    description?: string;
    eventType?: string;
    priority?: string;
    location?: string;
    startAt: string;
    endAt: string;
    allDay?: boolean;
    timezone?: string;
    recurrenceRule?: string;
    scope?: Record<string, unknown>;
    reminderMinutes?: number[];
    channels?: string[];
    createdById?: string;
  }) {
    const { rows } = await query(
      `INSERT INTO calendar_events (organization_id, title, description, event_type, priority, location, start_at, end_at, all_day, timezone, recurrence_rule, scope, reminder_minutes, channels, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        input.organizationId,
        input.title,
        input.description ?? null,
        input.eventType ?? 'meeting',
        input.priority ?? 'normal',
        input.location ?? null,
        input.startAt,
        input.endAt,
        input.allDay ?? false,
        input.timezone ?? 'UTC',
        input.recurrenceRule ?? null,
        input.scope ?? {},
        input.reminderMinutes ?? [15, 60],
        input.channels ?? ['in_app'],
        input.createdById ?? null,
      ],
    );
    return mapCalendarEvent(rows[0]);
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM calendar_events WHERE id = $1`, [id]);
    return rows[0] ? mapCalendarEvent(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filters: { eventType?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number } = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.eventType) { conditions.push(`event_type = $${i++}`); params.push(filters.eventType); }
    if (filters.dateFrom) { conditions.push(`start_at >= $${i++}`); params.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push(`end_at <= $${i++}`); params.push(filters.dateTo); }
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(`SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY start_at ASC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return rows.map(mapCalendarEvent);
  },

  async update(id: string, patch: Partial<{ title: string; description: string; startAt: string; endAt: string }>) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.startAt !== undefined) set('start_at', patch.startAt);
    if (patch.endAt !== undefined) set('end_at', patch.endAt);
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapCalendarEvent(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM calendar_events WHERE id = $1`, [id]);
  },
};

export const eventAttendeeRepo = {
  async create(input: { calendarEventId: string; organizationId: string; userId?: string; status?: string }) {
    const { rows } = await query(
      `INSERT INTO event_attendees (calendar_event_id, organization_id, user_id, status) VALUES ($1, $2, $3, $4) ON CONFLICT (calendar_event_id, user_id) DO UPDATE SET updated_at = now() RETURNING *`,
      [input.calendarEventId, input.organizationId, input.userId ?? null, input.status ?? 'invited'],
    );
    return mapEventAttendee(rows[0]);
  },

  async listByEvent(calendarEventId: string) {
    const { rows } = await query(`SELECT * FROM event_attendees WHERE calendar_event_id = $1`, [calendarEventId]);
    return rows.map(mapEventAttendee);
  },

  async updateStatus(id: string, status: string) {
    const { rows } = await query(`UPDATE event_attendees SET status = $1, response_at = now(), updated_at = now() WHERE id = $2 RETURNING *`, [status, id]);
    return rows[0] ? mapEventAttendee(rows[0]) : null;
  },

  async checkIn(id: string) {
    const { rows } = await query(`UPDATE event_attendees SET checked_in_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapEventAttendee(rows[0]) : null;
  },
};
