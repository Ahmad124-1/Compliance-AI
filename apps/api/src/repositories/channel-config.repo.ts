import { query } from '../db/pool.js';

function mapChannelConfig(row: any) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    channel: row.channel,
    priority: row.priority,
    enabled: row.enabled,
    config: row.config ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const channelConfigRepo = {
  async upsert(input: { organizationId: string; userId?: string; channel: string; priority?: number; enabled?: boolean; config?: Record<string, unknown> }) {
    const { rows } = await query(
      `INSERT INTO channel_configs (organization_id, user_id, channel, priority, enabled, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, user_id, channel)
       DO UPDATE SET priority = EXCLUDED.priority, enabled = EXCLUDED.enabled, config = EXCLUDED.config, updated_at = now() RETURNING *`,
      [input.organizationId, input.userId ?? null, input.channel, input.priority ?? 100, input.enabled ?? true, input.config ?? {}],
    );
    return mapChannelConfig(rows[0]);
  },

  async listByOrganization(orgId: string, userId?: string) {
    if (userId) {
      const { rows } = await query(`SELECT * FROM channel_configs WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
      return rows.map(mapChannelConfig);
    }
    const { rows } = await query(`SELECT * FROM channel_configs WHERE organization_id = $1 AND user_id IS NULL`, [orgId]);
    return rows.map(mapChannelConfig);
  },

  async findByUserAndChannel(orgId: string, userId: string, channel: string) {
    const { rows } = await query(`SELECT * FROM channel_configs WHERE organization_id = $1 AND user_id = $2 AND channel = $3`, [orgId, userId, channel]);
    return rows[0] ? mapChannelConfig(rows[0]) : null;
  },

  async delete(id: string) {
    await query(`DELETE FROM channel_configs WHERE id = $1`, [id]);
  },
};
