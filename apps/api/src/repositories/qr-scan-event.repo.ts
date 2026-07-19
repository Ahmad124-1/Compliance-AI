import { query } from '../db/pool.js';

export const mapQrScanEvent = (row) => ({
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

export const qrScanEventRepo = {
  async create(input) {
    const { rows } = await query(
      `INSERT INTO qr_scan_events (organization_id, qr_code_id, ip_address, user_agent, country, city, device, browser)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.qrCodeId,
        input.ipAddress ?? null,
        input.userAgent ?? null,
        input.country ?? null,
        input.city ?? null,
        input.device ?? null,
        input.browser ?? null,
      ],
    );
    return mapQrScanEvent(rows[0]);
  },

  async listByQrCode(qrCodeId, limit = 100, offset = 0) {
    const { rows } = await query(
      `SELECT * FROM qr_scan_events WHERE qr_code_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [qrCodeId, limit, offset],
    );
    return rows.map(mapQrScanEvent);
  },

  async listByOrganization(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.qrCodeId) { conditions.push(`qr_code_id = $${i++}`); params.push(filters.qrCodeId); }
    if (filters.dateFrom) { conditions.push(`created_at >= $${i++}`); params.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push(`created_at <= $${i++}`); params.push(filters.dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`SELECT * FROM qr_scan_events ${where} ORDER BY created_at DESC`, params);
    return rows.map(mapQrScanEvent);
  },

  async getAnalytics(qrCodeId) {
    const { rows } = await query(
      `SELECT COUNT(*) AS total_scans, COUNT(DISTINCT ip_address) AS unique_visitors, MAX(created_at) AS last_scan
       FROM qr_scan_events WHERE qr_code_id = $1`,
      [qrCodeId],
    );
    return rows[0];
  },

  async getOrgAnalytics(orgId, filters: any = {}) {
    const conditions = ['organization_id = $1'];
    const params = [orgId];
    let i = 2;

    if (filters.qrCodeId) { conditions.push(`qr_code_id = $${i++}`); params.push(filters.qrCodeId); }
    if (filters.dateFrom) { conditions.push(`created_at >= $${i++}`); params.push(filters.dateFrom); }
    if (filters.dateTo) { conditions.push(`created_at <= $${i++}`); params.push(filters.dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT COUNT(*) AS total_scans, COUNT(DISTINCT ip_address) AS unique_visitors, COUNT(DISTINCT country) AS countries, MAX(created_at) AS last_scan
       FROM qr_scan_events ${where}`,
      params,
    );
    return rows[0];
  },
};
