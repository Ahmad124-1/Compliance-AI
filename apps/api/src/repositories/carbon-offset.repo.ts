import { query } from '../db/pool.js';
import type { CarbonOffset, OffsetType } from '../types/carbon.js';

function mapCarbonOffset(row: any): CarbonOffset {
  return {
    id: row.id,
    organizationId: row.organization_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    offsetType: row.offset_type,
    registry: row.registry,
    registryId: row.registry_id,
    creditsPurchased: parseInt(row.credits_purchased, 10),
    creditsRetired: parseInt(row.credits_retired, 10),
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    costPerTon: row.cost_per_ton !== null ? parseFloat(row.cost_per_ton) : null,
    totalCost: row.total_cost !== null ? parseFloat(row.total_cost) : null,
    certificateUrl: row.certificate_url,
    verificationStatus: row.verification_status,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CarbonOffsetFilter {
  projectId?: string;
  offsetType?: OffsetType;
}

export const carbonOffsetRepo = {
  async create(input: {
    organizationId: string;
    projectId?: string;
    name: string;
    description?: string;
    offsetType: OffsetType;
    registry?: string;
    registryId?: string;
    creditsPurchased: number;
    creditsRetired?: number;
    purchaseDate: string;
    expiryDate?: string;
    costPerTon?: number;
    totalCost?: number;
    certificateUrl?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
    verifiedBy?: string;
    verifiedAt?: string;
  }): Promise<CarbonOffset> {
    const { rows } = await query<CarbonOffset>(
      `INSERT INTO carbon_offsets (organization_id, project_id, name, description, offset_type, registry, registry_id, credits_purchased, credits_retired, purchase_date, expiry_date, cost_per_ton, total_cost, certificate_url, verification_status, verified_by, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        input.organizationId,
        input.projectId ?? null,
        input.name,
        input.description ?? null,
        input.offsetType,
        input.registry ?? null,
        input.registryId ?? null,
        input.creditsPurchased,
        input.creditsRetired ?? 0,
        input.purchaseDate,
        input.expiryDate ?? null,
        input.costPerTon ?? null,
        input.totalCost ?? null,
        input.certificateUrl ?? null,
        input.verificationStatus ?? 'pending',
        input.verifiedBy ?? null,
        input.verifiedAt ?? null,
      ],
    );
    return mapCarbonOffset(rows[0]);
  },

  async findById(id: string, orgId: string): Promise<CarbonOffset | null> {
    const { rows } = await query<CarbonOffset>(
      `SELECT * FROM carbon_offsets WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return rows[0] ? mapCarbonOffset(rows[0]) : null;
  },

  async listByOrganization(orgId: string, filter: CarbonOffsetFilter = {}): Promise<CarbonOffset[]> {
    const where: string[] = ['organization_id = $1 AND is_deleted = FALSE'];
    const params: unknown[] = [orgId];
    let i = 2;
    if (filter.projectId) {
      where.push(`project_id = $${i++}`);
      params.push(filter.projectId);
    }
    if (filter.offsetType) {
      where.push(`offset_type = $${i++}`);
      params.push(filter.offsetType);
    }
    const { rows } = await query<CarbonOffset>(
      `SELECT * FROM carbon_offsets WHERE ${where.join(' AND ')} ORDER BY created_at DESC`,
      params,
    );
    return rows.map(mapCarbonOffset);
  },

  async update(id: string, orgId: string, patch: Partial<Pick<CarbonOffset, 'projectId' | 'name' | 'description' | 'offsetType' | 'registry' | 'registryId' | 'creditsPurchased' | 'creditsRetired' | 'purchaseDate' | 'expiryDate' | 'costPerTon' | 'totalCost' | 'certificateUrl' | 'verificationStatus' | 'verifiedBy' | 'verifiedAt'>>): Promise<CarbonOffset | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${i++}`);
      params.push(val);
    };
    if (patch.projectId !== undefined) set('project_id', patch.projectId);
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.offsetType !== undefined) set('offset_type', patch.offsetType);
    if (patch.registry !== undefined) set('registry', patch.registry);
    if (patch.registryId !== undefined) set('registry_id', patch.registryId);
    if (patch.creditsPurchased !== undefined) set('credits_purchased', patch.creditsPurchased);
    if (patch.creditsRetired !== undefined) set('credits_retired', patch.creditsRetired);
    if (patch.purchaseDate !== undefined) set('purchase_date', patch.purchaseDate);
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate);
    if (patch.costPerTon !== undefined) set('cost_per_ton', patch.costPerTon);
    if (patch.totalCost !== undefined) set('total_cost', patch.totalCost);
    if (patch.certificateUrl !== undefined) set('certificate_url', patch.certificateUrl);
    if (patch.verificationStatus !== undefined) set('verification_status', patch.verificationStatus);
    if (patch.verifiedBy !== undefined) set('verified_by', patch.verifiedBy);
    if (patch.verifiedAt !== undefined) set('verified_at', patch.verifiedAt);
    if (!sets.length) return this.findById(id, orgId);
    sets.push('updated_at = now()');
    params.push(id, orgId);
    const { rows } = await query<CarbonOffset>(
      `UPDATE carbon_offsets SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} AND is_deleted = FALSE RETURNING *`,
      params,
    );
    return rows[0] ? mapCarbonOffset(rows[0]) : null;
  },

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE carbon_offsets SET is_deleted = TRUE, updated_at = now() WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`,
      [id, orgId],
    );
    return (rowCount ?? 0) > 0;
  },
};
