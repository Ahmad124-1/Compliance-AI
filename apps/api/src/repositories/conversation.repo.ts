import { query } from '../db/pool.js';

function mapConversation(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    type: row.type,
    category: row.category,
    isEncrypted: row.is_encrypted,
    isArchived: row.is_archived,
    metadata: row.metadata ?? {},
    createdById: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapParticipant(row: any) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    lastReadMessageId: row.last_read_message_id,
    isMuted: row.is_muted,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const conversationRepo = {
  async create(input: { organizationId: string; title?: string; type?: string; category?: string; createdById?: string }) {
    const { rows } = await query(
      `INSERT INTO conversations (organization_id, title, type, category, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.organizationId, input.title ?? null, input.type ?? 'direct', input.category ?? null, input.createdById ?? null],
    );
    return mapConversation(rows[0]);
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM conversations WHERE id = $1`, [id]);
    return rows[0] ? mapConversation(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filters: { type?: string; category?: string; limit?: number; offset?: number } = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    if (filters.category) { conditions.push(`category = $${i++}`); params.push(filters.category); }
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const { rows } = await query(`SELECT * FROM conversations WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT $${i} OFFSET $${i + 1}`, [...params, limit, offset]);
    return rows.map(mapConversation);
  },

  async update(id: string, patch: Partial<{ title: string; isArchived: boolean; metadata: Record<string, unknown> }>) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col: string, val: any) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.isArchived !== undefined) set('is_archived', patch.isArchived);
    if (patch.metadata !== undefined) set('metadata', patch.metadata);
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await query(`UPDATE conversations SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapConversation(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM conversations WHERE id = $1`, [id]);
  },
};

export const conversationParticipantRepo = {
  async create(input: { conversationId: string; organizationId: string; userId?: string; role?: string }) {
    const { rows } = await query(
      `INSERT INTO conversation_participants (conversation_id, organization_id, user_id, role) VALUES ($1, $2, $3, $4) ON CONFLICT (conversation_id, user_id) DO UPDATE SET left_at = NULL, updated_at = now() RETURNING *`,
      [input.conversationId, input.organizationId, input.userId ?? null, input.role ?? 'member'],
    );
    return mapParticipant(rows[0]);
  },

  async listByConversation(conversationId: string) {
    const { rows } = await query(`SELECT * FROM conversation_participants WHERE conversation_id = $1 AND left_at IS NULL`, [conversationId]);
    return rows.map(mapParticipant);
  },

  async listByUser(orgId: string, userId: string) {
    const { rows } = await query(`SELECT * FROM conversation_participants WHERE organization_id = $1 AND user_id = $2 AND left_at IS NULL`, [orgId, userId]);
    return rows.map(mapParticipant);
  },

  async updateLastRead(conversationId: string, userId: string, messageId?: string) {
    const { rows } = await query(
      `UPDATE conversation_participants SET last_read_message_id = $1, updated_at = now() WHERE conversation_id = $2 AND user_id = $3 RETURNING *`,
      [messageId ?? null, conversationId, userId],
    );
    return rows[0] ? mapParticipant(rows[0]) : null;
  },

  async remove(conversationId: string, userId: string) {
    await query(`UPDATE conversation_participants SET left_at = now() WHERE conversation_id = $1 AND user_id = $2`, [conversationId, userId]);
  },
};
