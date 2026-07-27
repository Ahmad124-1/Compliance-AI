import { query } from '../db/pool.js';
import type { EmissionFactor, FactorType } from '../types/carbon.js';

function mapEmissionFactor(row: any): EmissionFactor {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    factorType: row.factor_type,
    category: row.category,
    subcategory: row.subcategory,
    value: parseFloat(row.value),
    unit: row.unit,
    source: row.source,
    sourceUrl: row.source_url,
    geography: row.geography,
    effectiveDate: row.effective_date,
    expiryDate: row.expiry_date,
    version: parseInt(row.version, 10),
    isActive: row.is_active,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface EmissionFactorFilter {
  factorType?: FactorType;
  category?: string;
  isActive?: boolean;
}

export const emissionFactorRepo = {
  async create(input: {
    organizationId: string;
    name: string;
    description?: string;
    factorType: FactorType;
    category: string;
    subcategory?: string;
    value: number;
    unit: string;
    source: string;
    sourceUrl?: string;
    geography?: string;
    effectiveDate: string;
    expiryDate?: string;
    version?: number;
    isActive?: boolean;
  }): Promise<EmissionFactor> {
    const { rows } = await query<EmissionFactor>(
      `INSERT INTO emission_factors (organization_id, name, description, factor_type, category, subcategory, value, unit, source, source_url, geography, effective_date, expiry_date, version, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.factorType,
        input.category,
        input.subcategory ?? null,
        input.value,
        input.unit,
        input.source,
        input.sourceUrl ?? null,
        input.geography ?? null,
        input.effectiveDate,
        input.expiryDate ?? null,
        input.version ?? 1,
        input.isActive ?? true,
      ],
    );
    return mapEmissionFactor(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<EmissionFactor | null> {
    const { rows } = await query<EmissionFactor>(
      `SELECT * FROM emission_factors WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapEmissionFactor(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: EmissionFactorFilter = {}): Promise<EmissionFactor[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.factorType) {
      where.push(`factor_type = $${i++}`);
      params.push(filter.factorType);
    }
    if (filter.category) {
      where.push(`category = $${i++}`);
      params.push(filter.category);
    }
    if (filter.isActive !== undefined) {
      where.push(`is_active = $${i++}`);
      params.push(filter.isActive);
    }
    const { rows } = await query<EmissionFactor>(
      `SELECT * FROM emission_factors WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapEmissionFactor);
  },

  async listActive(orgId: string): Promise<EmissionFactor[]> {
    const { rows } = await query<EmissionFactor>(
      `SELECT * FROM emission_factors WHERE organization_id = $1 AND is_active = TRUE AND is_deleted = FALSE ORDER BY created_at DESC`,
      [orgId],
    );
    return rows.map(mapEmissionFactor);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<EmissionFactor, 'name' | 'description' | 'factorType' | 'category' | 'subcategory' | 'value' | 'unit' | 'source' | 'sourceUrl' | 'geography' | 'effectiveDate' | 'expiryDate' | 'version' | 'isActive'>>): Promise<EmissionFactor | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.factorType !== undefined) set('factor_type', patch.factorType);
    if (patch.category !== undefined) set('category', patch.category);
    if (patch.subcategory !== undefined) set('subcategory', patch.subcategory);
    if (patch.value !== undefined) set('value', patch.value);
    if (patch.unit !== undefined) set('unit', patch.unit);
    if (patch.source !== undefined) set('source', patch.source);
    if (patch.sourceUrl !== undefined) set('source_url', patch.sourceUrl);
    if (patch.geography !== undefined) set('geography', patch.geography);
    if (patch.effectiveDate !== undefined) set('effective_date', patch.effectiveDate);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.version !== undefined) set('version', patch.version);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<EmissionFactor>(
      `UPDATE emission_factors SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapEmissionFactor(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE emission_factors SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
