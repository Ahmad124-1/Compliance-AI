import { query } from '../db/pool.js';

export const mapQrCode = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  siteId: row.site_id,
  departmentId: row.department_id,
  name: row.name,
  type: row.type,
  code: row.code,
  url: row.url,
  configuration: row.configuration,
  scanCount: row.scan_count,
  lastScannedAt: row.last_scanned_at,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const qrCodeRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO qr_codes (organization_id, site_id, department_id, name, type, code, url, configuration, scan_count, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        input.organizationId,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.name,
        input.type,
        input.code,
        input.url,
        JSON.stringify(input.configuration ?? {}),
        input.scanCount ?? 0,
        input.isActive ?? true,
      ],
    );
    return mapQrCode(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM qr_codes WHERE id = $1`, [id]);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async findByCode(code) {
    const { rows } = await query(`SELECT * FROM qr_codes WHERE code = $1`, [code]);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async findByOrganization(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }
    if (filters.siteId) { conditions.push(`site_id = $${i++}`); params.push(filters.siteId); }
    if (filters.departmentId) { conditions.push(`department_id = $${i++}`); params.push(filters.departmentId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM qr_codes ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapQrCode);
  },

  async update(id, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };

    if (patch.name !== undefined) set('name', patch.name);
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.url !== undefined) set('url', patch.url);
    if (patch.configuration !== undefined) set('configuration', JSON.stringify(patch.configuration));
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE qr_codes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async incrementScan(id) {
    const { rows } = await query(`UPDATE qr_codes SET scan_count = scan_count + 1, last_scanned_at = now() WHERE id = $1 RETURNING *`, [id]);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM qr_codes WHERE id = $1`, [id]);
  },
};
