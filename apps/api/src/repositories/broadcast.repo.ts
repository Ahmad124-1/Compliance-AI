import { query } from '../db/pool.js';

function mapBroadcast(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    senderId: row.sender_id,
    title: row.title,
    body: row.body,
    broadcastType: row.broadcast_type,
    priority: row.priority,
    scope: row.scope ?? {},
    channels: row.channels ?? [],
    locale: row.locale,
    attachments: row.attachments ?? [],
    acknowledgementRequired: row.acknowledgement_required,
    readTracking: row.read_tracking,
    expiryDate: row.expiry_date,
    pinned: row.pinned,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBroadcastRecipient(row: any) {
  return {
    id: row.id,
    broadcastId: row.broadcast_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    channel: row.channel,
    status: row.status,
    readAt: row.read_at,
    acknowledgedAt: row.acknowledged_at,
    deliveredAt: row.delivered_at,
    sentAt: row.sent_at,
    attempts: row.attempts,
    lastError: row.last_error,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const broadcastRepo = {
  async create(input: {
    organizationId: string;
    senderId?: string;
    title: string;
    body: string;
    broadcastType?: string;
    priority?: string;
    scope?: Record<string, unknown>;
    channels?: string[];
    locale?: string;
    attachments?: any[];
    acknowledgementRequired?: boolean;
    readTracking?: boolean;
    expiryDate?: string;
    pinned?: boolean;
    scheduledAt?: string;
  }) {
    const { rows } = await query(
      `INSERT INTO broadcasts (organization_id, sender_id, title, body, broadcast_type, priority, scope, channels, locale, attachments, acknowledgement_required, read_tracking, expiry_date, pinned, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        input.organizationId,
        input.senderId ?? null,
        input.title,
        input.body,
        input.broadcastType ?? 'company',
        input.priority ?? 'normal',
        input.scope ?? {},
        input.channels ?? ['in_app'],
        input.locale ?? 'en',
        input.attachments ?? [],
        input.acknowledgementRequired ?? false,
        input.readTracking ?? true,
        input.expiryDate ?? null,
        input.pinned ?? false,
        input.scheduledAt ?? null,
      ],
    );
    return mapBroadcast(rows[0]);
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM broadcasts WHERE id = $1`, [id]);
    return rows[0] ? mapBroadcast(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filters: { broadcastType?: string; priority?: string; limit?: number; offset?: number } = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.broadcastType) { conditions.push(`broadcast_type = $${i++}`); params.push(filters.broadcastType); }
    if (filters.priority) { conditions.push(`priority = $${i++}`); params.push(filters.priority); }
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(`SELECT * FROM broadcasts WHERE ${conditions.join(' AND ')} ORDER BY pinned DESC, created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return rows.map(mapBroadcast);
  },

  async update(id: string, patch: Partial<{ title: string; body: string; pinned: boolean; expiryDate: string }>) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.body !== undefined) set('body', patch.body);
    if (patch.pinned !== undefined) set('pinned', patch.pinned);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query(`UPDATE broadcasts SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapBroadcast(rows[0]) : null;
  },

  async markSent(id: string) {
    const { rows } = await query(`UPDATE broadcasts SET sent_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapBroadcast(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM broadcasts WHERE id = $1`, [id]);
  },
};

export const broadcastRecipientRepo = {
  async create(input: { broadcastId: string; organizationId: string; userId?: string; channel?: string }) {
    const { rows } = await query(
      `INSERT INTO broadcast_recipients (broadcast_id, organization_id, user_id, channel) VALUES ($1, $2, $3, $4) ON CONFLICT (broadcast_id, user_id) DO UPDATE SET channel = EXCLUDED.channel, updated_at = now() RETURNING *`,
      [input.broadcastId, input.organizationId, input.userId ?? null, input.channel ?? 'in_app'],
    );
    return mapBroadcastRecipient(rows[0]);
  },

  async bulkCreate(broadcastId: string, organizationId: string, userIds: string[], channel = 'in_app') {
    const values = userIds.map((uid, idx) => `('${broadcastId}', '${organizationId}', '${uid}', '${channel}')`).join(', ');
    await query(`INSERT INTO broadcast_recipients (broadcast_id, organization_id, user_id, channel) VALUES ${values} ON CONFLICT (broadcast_id, user_id) DO UPDATE SET channel = EXCLUDED.channel`);
  },

  async listByBroadcast(broadcastId: string) {
    const { rows } = await query(`SELECT * FROM broadcast_recipients WHERE broadcast_id = $1 ORDER BY created_at DESC`, [broadcastId]);
    return rows.map(mapBroadcastRecipient);
  },

  async updateStatus(id: string, patch: Partial<{ status: string; readAt: string; acknowledgedAt: string; deliveredAt: string; sentAt: string; attempts: number; lastError: string }>) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.readAt !== undefined) set('read_at', patch.readAt);
    if (patch.acknowledgedAt !== undefined) set('acknowledged_at', patch.acknowledgedAt);
    if (patch.deliveredAt !== undefined) set('delivered_at', patch.deliveredAt);
    if (patch.sentAt !== undefined) set('sent_at', patch.sentAt);
    if (patch.attempts !== undefined) set('attempts', patch.attempts);
    if (patch.lastError !== undefined) set('last_error', patch.lastError);
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query(`UPDATE broadcast_recipients SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapBroadcastRecipient(rows[0]) : null;
  },

  async getByUserAndBroadcast(broadcastId: string, userId: string) {
    const { rows } = await query(`SELECT * FROM broadcast_recipients WHERE broadcast_id = $1 AND user_id = $2`, [broadcastId, userId]);
    return rows[0] ? mapBroadcastRecipient(rows[0]) : null;
  },
};
