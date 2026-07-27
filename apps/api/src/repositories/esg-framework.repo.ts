import { query } from '../db/pool.js';
import type { EsgFramework } from '../types/esg.js';

function mapFramework(row: any): EsgFramework {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    frameworkCode: row.framework_code,
    version: row.version,
    issuingBody: row.issuing_body,
    effectiveDate: row.effective_date,
    categories: row.categories ?? [],
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface FrameworkFilter {
  search?: string;
  frameworkCode?: string;
  isActive?: boolean;
}

export const esgFrameworkRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    frameworkCode: string;
    version?: string;
    issuingBody?: string;
    effectiveDate?: string;
    categories?: Record<string, unknown>[];
  }): Promise<EsgFramework> {
    const { rows } = await query<EsgFramework>(
      `INSERT INTO esg_frameworks (organization_id, name, description, framework_code, version, issuing_body, effective_date, categories)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.frameworkCode,
        input.version ?? 'latest',
        input.issuingBody ?? null,
        input.effectiveDate ?? null,
        input.categories ?? [],
      ],
    );
    return mapFramework(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EsgFramework | null> {
    const { rows } = await query<EsgFramework>(
      `SELECT * FROM esg_frameworks WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapFramework(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: FrameworkFilter = {}): Promise<EsgFramework[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.search) {
      where.push(`(name ILIKE $${i} OR description ILIKE $${i})`);
      params.push(`%${filter.search}%`);
      i++;
    }
    if (filter.frameworkCode) {
      where.push(`framework_code = $${i++}`);
      params.push(filter.frameworkCode);
    }
    if (filter.isActive !== undefined) {
      where.push(`is_active = $${i++}`);
      params.push(filter.isActive);
    }
    const { rows } = await query<EsgFramework>(
      `SELECT * FROM esg_frameworks WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapFramework);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EsgFramework, 'name' | 'description' | 'version' | 'issuingBody' | 'effectiveDate' | 'categories' | 'isActive'>>): Promise<EsgFramework | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.version !== undefined) set('version', patch.version);
    if (patch.issuingBody !== undefined) set('issuing_body', patch.issuingBody);
    if (patch.effectiveDate !== undefined) set('effective_date', patch.effectiveDate);
    if (patch.categories !== undefined) set('categories', patch.categories);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EsgFramework>(
      `UPDATE esg_frameworks SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapFramework(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE esg_frameworks SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
