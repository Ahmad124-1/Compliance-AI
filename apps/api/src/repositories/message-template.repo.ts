import { query } from '../db/pool.js';

export const mapMessageTemplate = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  name: row.name,
  channel: row.channel,
  type: row.type,
  subject: row.subject,
  body: row.body,
  variables: row.variables,
  locale: row.locale,
  isDefault: row.is_default,
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const messageTemplateRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO message_templates (organization_id, name, channel, type, subject, body, variables, locale, is_default, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.organizationId ?? null,
        input.name,
        input.channel,
        input.type,
        input.subject ?? null,
        input.body,
        JSON.stringify(input.variables ?? []),
        input.locale ?? 'en',
        input.isDefault ?? false,
        input.version ?? 1,
      ],
    );
    return mapMessageTemplate(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM message_templates WHERE id = $1`, [id]);
    return rows[0] ? mapMessageTemplate(rows[0]) : null;
  },

  async findByOrg(orgId, channel, type) {
    const { rows } = await query(
      `SELECT * FROM message_templates WHERE organization_id = $1 AND channel = $2 AND type = $3 AND is_default = FALSE ORDER BY version DESC LIMIT 1`,
      [orgId, channel, type],
    );
    return rows[0] ? mapMessageTemplate(rows[0]) : null;
  },

  async listByOrganization(orgId) {
    const { rows } = await query(
      `SELECT * FROM message_templates WHERE organization_id = $1 ORDER BY channel, type, version DESC`,
      [orgId],
    );
    return rows.map(mapMessageTemplate);
  },

  async findByOrganization(orgId: string, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params: any[] = [orgId];
    let i = 2;
    if (filters.channel) { conditions.push(`channel = $${i++}`); params.push(filters.channel); }
    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    const { rows } = await query(`SELECT * FROM message_templates WHERE ${conditions.join(' AND ')} ORDER BY channel, type, version DESC`, params);
    return rows.map(mapMessageTemplate);
  },

  async findDefault(channel: string, type: string, locale = 'en') {
    const { rows } = await query(
      `SELECT * FROM message_templates WHERE channel = $1 AND type = $2 AND locale = $3 AND is_default = TRUE ORDER BY version DESC LIMIT 1`,
      [channel, type, locale],
    );
    return rows[0] ? mapMessageTemplate(rows[0]) : null;
  },

  async listDefaults() {
    const { rows } = await query(`SELECT * FROM message_templates WHERE is_default = TRUE ORDER BY channel, type`);
    return rows.map(mapMessageTemplate);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.channel !== undefined) set('channel', patch.channel);
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.subject !== undefined) set('subject', patch.subject);
    if (patch.body !== undefined) set('body', patch.body);
    if (patch.variables !== undefined) set('variables', JSON.stringify(patch.variables));
    if (patch.locale !== undefined) set('locale', patch.locale);
    if (patch.isDefault !== undefined) set('is_default', patch.isDefault);
    if (patch.version !== undefined) set('version', patch.version);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE message_templates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapMessageTemplate(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM message_templates WHERE id = $1`, [id]);
  },
};
