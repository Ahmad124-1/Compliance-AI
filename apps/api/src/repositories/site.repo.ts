import { query } from '../db/pool.js';
import type { Site } from '../types/index.js';

function mapSite(row: any): Site {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    address: row.address,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const siteRepo = {
  async create(orgId: string, name: string, code?: string | null, address?: Record<string, unknown> | null): Promise<Site> {
    const { rows } = await query<Site>(
      `INSERT INTO sites (organization_id, name, code, address) VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, name, code ?? null, address ? JSON.stringify(address) : null],
    );
    return mapSite(rows[0]);
  },
  async findById(id: string): Promise<Site | null> {
    const { rows } = await query(`SELECT * FROM sites WHERE id = $1`, [id]);
    return rows[0] ? mapSite(rows[0]) : null;
  },
  async listByOrganization(orgId: string): Promise<Site[]> {
    const { rows } = await query(`SELECT * FROM sites WHERE organization_id = $1 ORDER BY name`, [orgId]);
    return rows.map(mapSite);
  },
  async update(id: string, patch: Partial<Pick<Site, 'name' | 'code' | 'address' | 'isActive'>>): Promise<Site | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.address !== undefined) set('address', JSON.stringify(patch.address));
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE sites SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapSite(rows[0]) : null;
  },
};

