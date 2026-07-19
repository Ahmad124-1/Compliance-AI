import { query } from '../db/pool.js';
import type { Team } from '../types/index.js';

function mapTeam(row: any): Team {
  return {
    id: row.id,
    organizationId: row.organization_id,
    departmentId: row.department_id,
    name: row.name,
    code: row.code,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const teamRepo = {
  async create(orgId: string, name: string, departmentId?: string | null, code?: string | null): Promise<Team> {
    const { rows } = await query<Team>(
      `INSERT INTO teams (organization_id, name, department_id, code) VALUES ($1, $2, $3, $4) RETURNING *`,
      [orgId, name, departmentId ?? null, code ?? null],
    );
    return mapTeam(rows[0]);
  },
  async findById(id: string): Promise<Team | null> {
    const { rows } = await query(`SELECT * FROM teams WHERE id = $1`, [id]);
    return rows[0] ? mapTeam(rows[0]) : null;
  },
  async listByOrganization(orgId: string): Promise<Team[]> {
    const { rows } = await query(`SELECT * FROM teams WHERE organization_id = $1 ORDER BY name`, [orgId]);
    return rows.map(mapTeam);
  },
  async update(id: string, patch: Partial<Pick<Team, 'name' | 'code' | 'departmentId' | 'isActive'>>): Promise<Team | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.departmentId !== undefined) set('department_id', patch.departmentId);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query(`UPDATE teams SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapTeam(rows[0]) : null;
  },
};

