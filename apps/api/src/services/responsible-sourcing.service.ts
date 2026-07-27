import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { ResponsibleMaterialRecord, SupplyChainLink } from '../modules/responsible-sourcing/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const responsibleSourcingService = {
  async createMaterial(organizationId: string, supplierId: string, input: Partial<ResponsibleMaterialRecord> & { materialName: string; materialCategory: string }, actorId?: string | null): Promise<ResponsibleMaterialRecord> {
    const record: ResponsibleMaterialRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      materialName: input.materialName,
      materialCategory: input.materialCategory as any,
      countryOfOrigin: input.countryOfOrigin ?? null,
      traceabilityId: input.traceabilityId ?? null,
      traceabilityStatus: input.traceabilityStatus ?? 'unknown',
      supplyChainMapping: input.supplyChainMapping ?? [],
      certifyingBody: input.certifyingBody ?? null,
      certificationStatus: input.certificationStatus ?? null,
      chainOfCustody: input.chainOfCustody ?? 'not_verified',
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO responsible_materials (id, organization_id, supplier_id, material_name, material_category, country_of_origin, traceability_id, traceability_status, supply_chain_mapping, certifying_body, certification_status, chain_of_custody, quantity, unit, is_deleted, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [record.id, record.organizationId, record.supplierId, record.materialName, record.materialCategory, record.countryOfOrigin, record.traceabilityId, record.traceabilityStatus, JSON.stringify(record.supplyChainMapping), record.certifyingBody, record.certificationStatus, record.chainOfCustody, record.quantity, record.unit, record.isDeleted, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'responsible_material.create', entity: 'responsible_material', entityId: record.id });
    return record;
  },

  async listMaterials(organizationId: string, supplierId?: string, filters?: { materialCategory?: string; countryOfOrigin?: string }): Promise<ResponsibleMaterialRecord[]> {
    let sql = `SELECT * FROM responsible_materials WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    let idx = 2;
    if (supplierId) { sql += ` AND supplier_id = $${idx++}`; params.push(supplierId); }
    if (filters?.materialCategory) { sql += ` AND material_category = $${idx++}`; params.push(filters.materialCategory); }
    if (filters?.countryOfOrigin) { sql += ` AND country_of_origin = $${idx++}`; params.push(filters.countryOfOrigin); }
    sql += ` ORDER BY created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<ResponsibleMaterialRecord>);
  },

  async getMaterial(id: string, organizationId: string): Promise<ResponsibleMaterialRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM responsible_materials WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Material not found');
    const row = mapRow<ResponsibleMaterialRecord>(rows[0]);
    row.supplyChainMapping = typeof row.supplyChainMapping === 'string' ? JSON.parse(row.supplyChainMapping) : (row.supplyChainMapping ?? []);
    return row;
  },

  async updateMaterial(id: string, organizationId: string, input: Partial<ResponsibleMaterialRecord>, actorId?: string | null): Promise<ResponsibleMaterialRecord> {
    const existing = await this.getMaterial(id, organizationId);
    const updated: ResponsibleMaterialRecord = { ...existing, ...input, id, organizationId, updatedAt: new Date().toISOString() };
    await query(`UPDATE responsible_materials SET material_name=$2, material_category=$3, country_of_origin=$4, traceability_id=$5, traceability_status=$6, supply_chain_mapping=$7, certifying_body=$8, certification_status=$9, chain_of_custody=$10, quantity=$11, unit=$12, updated_at=NOW() WHERE id=$1`, [id, updated.materialName, updated.materialCategory, updated.countryOfOrigin, updated.traceabilityId, updated.traceabilityStatus, JSON.stringify(updated.supplyChainMapping), updated.certifyingBody, updated.certificationStatus, updated.chainOfCustody, updated.quantity, updated.unit]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'responsible_material.update', entity: 'responsible_material', entityId: id });
    return updated;
  },

  async deleteMaterial(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE responsible_materials SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'responsible_material.delete', entity: 'responsible_material', entityId: id });
  },

  async getSourcingSummary(organizationId: string): Promise<{ totalMaterials: number; materialsByCategory: Record<string, number>; conflictFreeRate: number; traceabilityRate: number; chainOfCustodyVerified: number; countryBreakdown: Record<string, number> }> {
    const { rows } = await query<Record<string, any>>(`SELECT material_category, country_of_origin, traceability_status, chain_of_custody FROM responsible_materials WHERE organization_id = $1 AND is_deleted = FALSE`, [organizationId]);
    const byCategory: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    let conflictFree = 0; let traceable = 0; let custodyVerified = 0;
    for (const r of rows) {
      byCategory[r.material_category] = (byCategory[r.material_category] ?? 0) + 1;
      if (r.country_of_origin) byCountry[r.country_of_origin] = (byCountry[r.country_of_origin] ?? 0) + 1;
      if (r.traceability_status === 'full' || r.traceability_status === 'partial') traceable += 1;
      if (r.chain_of_custody === 'verified') custodyVerified += 1;
    }
    const total = rows.length;
    return { totalMaterials: total, materialsByCategory: byCategory, conflictFreeRate: total > 0 ? Math.round((conflictFree / total) * 100) : 0, traceabilityRate: total > 0 ? Math.round((traceable / total) * 100) : 0, chainOfCustodyVerified: custodyVerified, countryBreakdown: byCountry };
  },
};