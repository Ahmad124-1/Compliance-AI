import { query } from '../db/pool.js';
import type { GhgScope } from '../types/carbon.js';

function mapGhgScope(row: any): GhgScope {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    scopeNumber: row.scope_number,
    description: row.description,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GhgScopeFilter {
  scopeNumber?: 1 | 2 | 3;
}

export const ghgScopeRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    scopeNumber: 1 | 2 | 3;
    description?: string;
  }): Promise<GhgScope> {
    const { rows } = await query<GhgScope>(
      `INSERT INTO ghg_scopes (organization_id, name, scope_number, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.scopeNumber,
        input.description ?? null,
      ],
    );
    return mapGhgScope(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<GhgScope | null> {
    const { rows } = await query<GhgScope>(
      `SELECT * FROM ghg_scopes WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapGhgScope(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: GhgScopeFilter = {}): Promise<GhgScope[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.scopeNumber !== undefined) {
      where.push(`scope_number = $${i++}`);
      params.push(filter.scopeNumber);
    }
    const { rows } = await query<GhgScope>(
      `SELECT * FROM ghg_scopes WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapGhgScope);
  },

  async findByScopeNumber(orgId: string, scopeNumber: 1 | 2 | 3): Promise<GhgScope | null> {
    const { rows } = await query<GhgScope>(
      `SELECT * FROM ghg_scopes WHERE organization_id = $1 AND scope_number = $2 AND is_deleted = FALSE LIMIT 1`,
      [orgId, scopeNumber],
    );
    return rows[0] ? mapGhgScope(rows[0]) : null;
  },

  async update(id: string, orgId: string, patch: Partial<Pick<GhgScope, 'name' | 'scopeNumber' | 'description'>>): Promise<GhgScope | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.scopeNumber !== undefined) set('scope_number', patch.scopeNumber);
    if (patch.description !== undefined) set('description', patch.description);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<GhgScope>(
      `UPDATE ghg_scopes SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapGhgScope(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE ghg_scopes SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
