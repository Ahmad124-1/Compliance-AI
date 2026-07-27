import { query } from '../db/pool.js';
import type { EngagementEvent, EngagementEventAttendance } from '../types/engagement.js';

function mapEvent(row: any): EngagementEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    eventType: row.event_type,
    category: row.category,
    location: row.location,
    siteId: row.site_id,
    departmentId: row.department_id,
    startAt: row.start_at,
    endAt: row.end_at,
    isAllDay: row.is_all_day,
    maxAttendees: row.max_attendees,
    status: row.status,
    organizerId: row.organizer_id,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttendance(row: any): EngagementEventAttendance {
  return {
    id: row.id,
    organizationId: row.organization_id,
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
    rsvpStatus: row.rsvp_status,
    feedback: row.feedback ?? {},
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const eventRepo = {
  async findMany(orgId: string, filters: { eventType?: string; status?: string; siteId?: string; departmentId?: string; dateFrom?: string; dateTo?: string } = {}): Promise<EngagementEvent[]> {
    const conditions = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.eventType) { conditions.push(`event_type = $${idx++}`); params.push(filters.eventType); }
    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.siteId) { conditions.push(`site_id = $${idx++}`); params.push(filters.siteId); }
    if (filters.departmentId) { conditions.push(`department_id = $${idx++}`); params.push(filters.departmentId); }
    if (filters.dateFrom) { conditions.push(`start_at >= $${idx++}`); params.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push(`start_at <= $${idx++}`); params.push(filters.dateTo); }
    const { rows } = await query(`SELECT * FROM engagement_events WHERE ${conditions.join(' AND ')} ORDER BY start_at ASC`, params);
    return rows.map(mapEvent);
  },

  async findById(orgId: string, id: string): Promise<EngagementEvent | null> {
    const { rows } = await query(`SELECT * FROM engagement_events WHERE organization_id = $1 AND id = $2`, [orgId, id]);
    return rows[0] ? mapEvent(rows[0]) : null;
  },

  async create(input: Partial<EngagementEvent> & { organizationId: string; organizerId?: string | null }): Promise<EngagementEvent> {
    const { rows } = await query<EngagementEvent>(
      `INSERT INTO engagement_events (organization_id, title, description, event_type, category, location, site_id, department_id, start_at, end_at, is_all_day, max_attendees, status, organizer_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        input.organizationId,
        input.title,
        input.description ?? null,
        input.eventType ?? 'training',
        input.category ?? 'general',
        input.location ?? null,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.startAt,
        input.endAt ?? null,
        input.isAllDay ?? false,
        input.maxAttendees ?? null,
        input.status ?? 'scheduled',
        input.organizerId ?? null,
        input.tags ?? [],
      ],
    );
    return mapEvent(rows[0]);
  },

  async update(orgId: string, id: string, patch: Partial<EngagementEvent>): Promise<EngagementEvent | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.eventType) set('event_type', patch.eventType);
    if (patch.category) set('category', patch.category);
    if (patch.location !== undefined) set('location', patch.location);
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.startAt) set('start_at', patch.startAt);
    if (patch.endAt !== undefined) set('end_at', patch.endAt);
    if (patch.isAllDay !== undefined) set('is_all_day', patch.isAllDay);
    if (patch.maxAttendees !== undefined) set('max_attendees', patch.maxAttendees);
    if (patch.status) set('status', patch.status);
    if (patch.tags) set('tags', patch.tags);
    if (!sets.length) return this.findById(orgId, id);
    sets.push(`updated_at = now()`);
    params.push(orgId, id);
    const { rows } = await query(`UPDATE engagement_events SET ${sets.join(', ')} WHERE organization_id = $${i - 1} AND id = $${i} RETURNING *`, params);
    return rows[0] ? mapEvent(rows[0]) : null;
  },

  async findAttendance(orgId: string, eventId: string, userId?: string): Promise<EngagementEventAttendance[]> {
    if (userId) {
      const { rows } = await query(`SELECT * FROM engagement_event_attendance WHERE organization_id = $1 AND event_id = $2 AND user_id = $3`, [orgId, eventId, userId]);
      return rows.map(mapAttendance);
    }
    const { rows } = await query(`SELECT * FROM engagement_event_attendance WHERE organization_id = $1 AND event_id = $2 ORDER BY created_at ASC`, [orgId, eventId]);
    return rows.map(mapAttendance);
  },

  async upsertAttendance(input: Partial<EngagementEventAttendance> & { organizationId: string; eventId: string; userId: string }): Promise<EngagementEventAttendance> {
    const { rows } = await query<EngagementEventAttendance>(
      `INSERT INTO engagement_event_attendance (organization_id, event_id, user_id, status, rsvp_status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status, rsvp_status = EXCLUDED.rsvp_status, updated_at = now()
       RETURNING *`,
      [input.organizationId, input.eventId, input.userId, input.status ?? 'registered', input.rsvpStatus ?? 'pending'],
    );
    return mapAttendance(rows[0]);
  },

  async signIn(orgId: string, eventId: string, userId: string): Promise<EngagementEventAttendance | null> {
    const { rows } = await query(`UPDATE engagement_event_attendance SET checked_in_at = now(), status = 'attended', rsvp_status = 'accepted', updated_at = now() WHERE organization_id = $1 AND event_id = $2 AND user_id = $3 RETURNING *`, [orgId, eventId, userId]);
    return rows[0] ? mapAttendance(rows[0]) : null;
  },

  async signOut(orgId: string, eventId: string, userId: string): Promise<EngagementEventAttendance | null> {
    const { rows } = await query(`UPDATE engagement_event_attendance SET checked_out_at = now(), updated_at = now() WHERE organization_id = $1 AND event_id = $2 AND user_id = $3 RETURNING *`, [orgId, eventId, userId]);
    return rows[0] ? mapAttendance(rows[0]) : null;
  },

  async submitFeedback(orgId: string, eventId: string, userId: string, feedback: Record<string, unknown>): Promise<EngagementEventAttendance | null> {
    const { rows } = await query(`UPDATE engagement_event_attendance SET feedback = $1, updated_at = now() WHERE organization_id = $2 AND event_id = $3 AND user_id = $4 RETURNING *`, [feedback, orgId, eventId, userId]);
    return rows[0] ? mapAttendance(rows[0]) : null;
  },

  async getStats(orgId: string, eventId: string) {
    const { rows } = await query(
      `SELECT COUNT(*) as total, COUNT(CASE WHEN checked_in_at IS NOT NULL THEN 1 END) as attended, COUNT(CASE WHEN rsvp_status = 'accepted' THEN 1 END) as accepted FROM engagement_event_attendance WHERE organization_id = $1 AND event_id = $2`,
      [orgId, eventId],
    );
    return { total: parseInt(rows[0]?.total, 10), attended: parseInt(rows[0]?.attended, 10), accepted: parseInt(rows[0]?.accepted, 10) };
  },
};
