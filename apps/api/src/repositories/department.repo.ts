import { query } from '../db/pool.js';
import type { Department } from '../types/index.js';

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    organizationId: row.organization_id,
    siteId: row.site_id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const departmentRepo = {
  async create(orgId: string, name: string, siteId?: string | null, code?: string | null): Promise<Department> {
    const { rows } = await query<Department>(
      `INSERT INTO departments (organization_id, name, site_id, code) VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, name, siteId ?? null, code ?? null],
    );
    return mapDepartment(rows[0]);
  },
  async findById(id: string): Promise<Department | null> {
    const { rows } = await query(`SELECT * FROM departments WHERE id = $1`, [id]);
    return rows[0] ? mapDepartment(rows[0]) : null;
  },
  async listByOrganization(orgId: string): Promise<Department[]> {
    const { rows } = await query(`SELECT * FROM departments WHERE organization_id = $1 ORDER BY name`, [orgId]);
    return rows.map(mapDepartment);
  },
  async update(id: string, patch: Partial<Pick<Department, 'name' | 'code' | 'siteId' | 'isActive'>>): Promise<Department | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.siteId !== undefined) set('site_id', patch.siteId);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE departments SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapDepartment(rows[0]) : null;
  },
};

