import { query } from '../db/pool.js';

const mapQrCode = (row) => ({
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

const mapQrScanEvent = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  qrCodeId: row.qr_code_id,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  country: row.country,
  city: row.city,
  device: row.device,
  browser: row.browser,
  createdAt: row.created_at,
});

export const qrRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO qr_codes (organization_id, site_id, department_id, name, type, code, url, configuration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.siteId ?? null,
        input.departmentId ?? null,
        input.name,
        input.type,
        input.code,
        input.url,
        JSON.stringify(input.configuration ?? {}),
      ],
    );
    return mapQrCode(rows[0]);
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM qr_codes WHERE id = $1`, [id]);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async findByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM qr_codes WHERE organization_id = $1 ORDER BY created_at DESC`, [orgId]);
    return rows.map(mapQrCode);
  },

  async findByCode(code) {
    const { rows } = await query(`SELECT * FROM qr_codes WHERE code = $1`, [code]);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async listByOrg(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.type) { conditions.push(`type = $${i++}`); params.push(filters.type); }
    if (filters.siteId) { conditions.push(`site_id = $${i++}`); params.push(filters.siteId); }
    if (filters.departmentId) { conditions.push(`department_id = $${i++}`); params.push(filters.departmentId); }
    if (filters.isActive !== undefined) { conditions.push(`is_active = $${i++}`); params.push(filters.isActive); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countSql = `SELECT COUNT(*) FROM qr_codes ${where}`;
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const limit = filters.limit ?? 25;
    const offset = filters.offset ?? 0;
    const dataSql = `SELECT * FROM qr_codes ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
    const dataParams = [...params, limit, offset];
    const { rows } = await query(dataSql, dataParams);

    return { qrCodes: rows.map(mapQrCode), total };
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
    if (patch.scanCount !== undefined) set('scan_count', patch.scanCount);
    if (patch.lastScannedAt !== undefined) set('last_scanned_at', patch.lastScannedAt);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE qr_codes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapQrCode(rows[0]) : null;
  },

  async delete(id) {
    await query(`DELETE FROM qr_codes WHERE id = $1`, [id]);
  },

  async createScanEvent(input) {
    const { rows } = await query(
      `INSERT INTO qr_scan_events (organization_id, qr_code_id, ip_address, user_agent, country, city, device, browser)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [input.organizationId, input.qrCodeId, input.ipAddress ?? null, input.userAgent ?? null, input.country ?? null, input.city ?? null, input.device ?? null, input.browser ?? null],
    );
    return mapQrScanEvent(rows[0]);
  },

  async listScanEvents(qrCodeId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM qr_scan_events WHERE qr_code_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [qrCodeId, limit, offset],
    );
    return rows.map(mapQrScanEvent);
  },

  async getScanCount(qrCodeId) {
    const { rows } = await query(`SELECT COUNT(*) FROM qr_scan_events WHERE qr_code_id = $1`, [qrCodeId]);
    return parseInt(rows[0].count, 10);
  },
};
