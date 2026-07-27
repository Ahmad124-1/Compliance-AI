import { query } from '../db/pool.js';
import type { Announcement, AnnouncementRead } from '../types/worker-platform.js';

function mapAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    body: row.body,
    category: row.category,
    priority: row.priority,
    attachments: row.attachments ?? [],
    readStatus: row.read_status ?? {},
    acknowledgementRequired: row.acknowledgement_required,
    pinned: row.pinned,
    scheduledAt: row.scheduled_at,
    locale: row.locale,
    translations: row.translations ?? {},
    createdById: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRead(row: any): AnnouncementRead {
  return {
    id: row.id,
    announcementId: row.announcement_id,
    userId: row.user_id,
    readAt: row.read_at,
    acknowledgedAt: row.acknowledged_at,
    createdAt: row.created_at,
  };
}

export const announcementRepo = {
  async create(input: Partial<Announcement> & { organizationId: string; title: string; body: string }): Promise<Announcement> {
    const { rows } = await query<Announcement>(
      `INSERT INTO announcements (organization_id, title, body, category, priority, attachments, read_status, acknowledgement_required, pinned, scheduled_at, locale, translations, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        input.organizationId,
        input.title,
        input.body,
        input.category ?? 'general',
        input.priority ?? 'normal',
        input.attachments ?? [],
        input.readStatus ?? {},
        input.acknowledgementRequired ?? false,
        input.pinned ?? false,
        input.scheduledAt ?? null,
        input.locale ?? 'en',
        input.translations ?? {},
        input.createdById ?? null,
      ],
    );
    return mapAnnouncement(rows[0]);
  },

  async findById(id: string): Promise<Announcement | null> {
    const { rows } = await query(`SELECT * FROM announcements WHERE id = $1`, [id]);
    return rows[0] ? mapAnnouncement(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filters: { category?: string; pinned?: boolean; limit?: number; offset?: number } = {}): Promise<{ announcements: Announcement[]; total: number }> {
    const conditions: string[] = ['organization_id = $1'];
    const params: unknown[] = [orgId];
    let idx = 2;
    if (filters.category) { conditions.push(`category = $${idx++}`); params.push(filters.category); }
    if (filters.pinned !== undefined) { conditions.push(`pinned = $${idx++}`); params.push(filters.pinned); }
    const { rows } = await query(`SELECT *, count(*) OVER() AS total FROM announcements WHERE ${conditions.join(' AND ')} ORDER BY pinned DESC, created_at DESC LIMIT ${filters.limit ?? 100} OFFSET ${filters.offset ?? 0}`, params);
    const total = rows[0]?.total ?? 0;
    return { announcements: rows.map(mapAnnouncement), total };
  },

  async update(id: string, patch: Partial<Announcement>): Promise<Announcement | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.body !== undefined) set('body', patch.body);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.priority !== undefined) set('priority', patch.priority);
    if (patch.attachments !== undefined) set('attachments', patch.attachments);
    if (patch.readStatus !== undefined) set('read_status', patch.readStatus);
    if (patch.acknowledgementRequired !== undefined) set('acknowledgement_required', patch.acknowledgementRequired);
    if (patch.pinned !== undefined) set('pinned', patch.pinned);
    if (patch.scheduledAt !== undefined) set('scheduled_at', patch.scheduledAt);
    if (patch.locale !== undefined) set('locale', patch.locale);
    if (patch.translations !== undefined) set('translations', patch.translations);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE announcements SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapAnnouncement(rows[0]) : null;
  },

  async markRead(announcementId: string, userId: string): Promise<AnnouncementRead | null> {
    const { rows } = await query<AnnouncementRead>(
      `INSERT INTO announcement_reads (announcement_id, user_id, read_at) VALUES ($1, $2, now()) ON CONFLICT (announcement_id, user_id) DO UPDATE SET read_at = now() RETURNING *`,
      [announcementId, userId],
    );
    return rows[0] ? mapRead(rows[0]) : null;
  },

  async markAcknowledged(announcementId: string, userId: string): Promise<AnnouncementRead | null> {
    const { rows } = await query<AnnouncementRead>(
      `INSERT INTO announcement_reads (announcement_id, user_id, read_at, acknowledged_at) VALUES ($1, $2, now(), now()) ON CONFLICT (announcement_id, user_id) DO UPDATE SET acknowledged_at = now() RETURNING *`,
      [announcementId, userId],
    );
    return rows[0] ? mapRead(rows[0]) : null;
  },

  async listReads(announcementId: string): Promise<AnnouncementRead[]> {
    const { rows } = await query(`SELECT * FROM announcement_reads WHERE announcement_id = $1`, [announcementId]);
    return rows.map(mapRead);
  },
};
