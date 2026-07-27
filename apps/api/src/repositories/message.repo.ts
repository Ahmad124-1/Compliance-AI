import { query } from '../db/pool.js';

function mapMessage(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    type: row.type,
    category: row.category,
    priority: row.priority,
    subject: row.subject,
    body: row.body,
    channel: row.channel,
    channels: row.channels ?? [],
    locale: row.locale,
    attachments: row.attachments ?? [],
    metadata: row.metadata ?? {},
    encrypted: row.encrypted,
    readAt: row.read_at,
    deliveredAt: row.delivered_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const messageRepo = {
  async create(input: {
    organizationId: string;
    conversationId?: string;
    senderId?: string;
    recipientId?: string;
    type?: string;
    category?: string;
    priority?: string;
    subject?: string;
    body: string;
    channel?: string;
    channels?: string[];
    locale?: string;
    attachments?: any[];
    metadata?: Record<string, unknown>;
  }) {
    const { rows } = await query(
      `INSERT INTO messages (organization_id, conversation_id, sender_id, recipient_id, type, category, priority, subject, body, channel, channels, locale, attachments, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        input.organizationId,
        input.conversationId ?? null,
        input.senderId ?? null,
        input.recipientId ?? null,
        input.type ?? 'direct',
        input.category ?? 'general',
        input.priority ?? 'normal',
        input.subject ?? null,
        input.body,
        input.channel ?? 'in_app',
        input.channels ?? [input.channel ?? 'in_app'],
        input.locale ?? 'en',
        input.attachments ?? [],
        input.metadata ?? {},
      ],
    );
    return mapMessage(rows[0]);
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM messages WHERE id = $1`, [id]);
    return rows[0] ? mapMessage(rows[0]) : null;
  },

  async listByConversation(conversationId: string, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3`,
      [conversationId, limit, offset],
    );
    return rows.map(mapMessage);
  },

  async listByRecipient(orgId: string, userId: string, limit = 50, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM messages WHERE organization_id = $1 AND (recipient_id = $2 OR sender_id = $2) ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [orgId, userId, limit, offset],
    );
    return rows.map(mapMessage);
  },

  async listByOrganization(orgId: string, filters: { category?: string; priority?: string; limit?: number; offset?: number } = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.category) { conditions.push(`category = $${i++}`); params.push(filters.category); }
    if (filters.priority) { conditions.push(`priority = $${i++}`); params.push(filters.priority); }
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(`SELECT * FROM messages WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return rows.map(mapMessage);
  },

  async markRead(id: string) {
    const { rows } = await query(`UPDATE messages SET read_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapMessage(rows[0]) : null;
  },

  async markDelivered(id: string) {
    const { rows } = await query(`UPDATE messages SET delivered_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapMessage(rows[0]) : null;
  },

  async update(id: string, patch: Partial<{ readAt: string; deliveredAt: string; expiresAt: string }>) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.readAt !== undefined) set('read_at', patch.readAt);
    if (patch.deliveredAt !== undefined) set('delivered_at', patch.deliveredAt);
    if (patch.expiresAt !== undefined) set('expires_at', patch.expiresAt);
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query(`UPDATE messages SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapMessage(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM messages WHERE id = $1`, [id]);
  },
};
