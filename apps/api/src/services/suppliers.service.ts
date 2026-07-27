import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierRecord, SupplierFacilityRecord } from '../modules/suppliers/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const supplierService = {
  async createSupplier(organizationId: string, input: Partial<SupplierRecord> & { name: string }, actorId?: string | null): Promise<SupplierRecord> {
    const record: SupplierRecord = {
      id: randomUUID(),
      organizationId,
      name: input.name,
      code: input.code ?? null,
      description: input.description ?? null,
      category: input.category ?? null,
      industry: input.industry ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      city: input.city ?? null,
      address: input.address ?? null,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      website: input.website ?? null,
      taxId: input.taxId ?? null,
      registrationNumber: input.registrationNumber ?? null,
      businessUnit: input.businessUnit ?? null,
      status: input.status ?? 'active',
      riskLevel: input.riskLevel ?? 'low',
      esgScore: input.esgScore ?? 0,
      carbonScore: input.carbonScore ?? 0,
      complianceRate: input.complianceRate ?? 0,
      totalAssessments: 0,
      activeAudits: 0,
      openCorrectiveActions: 0,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO suppliers (id, organization_id, name, code, description, category, industry, country, region, city, address, contact_name, contact_email, contact_phone, website, tax_id, registration_number, business_unit, status, risk_level, esg_score, carbon_score, compliance_rate, total_assessments, active_audits, open_corrective_actions, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`, [record.id, record.organizationId, record.name, record.code, record.description, record.category, record.industry, record.country, record.region, record.city, JSON.stringify(record.address ?? {}), record.contactName, record.contactEmail, record.contactPhone, record.website, record.taxId, record.registrationNumber, record.businessUnit, record.status, record.riskLevel, record.esgScore, record.carbonScore, record.complianceRate, record.totalAssessments, record.activeAudits, record.openCorrectiveActions, JSON.stringify(record.metadata), record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier.create', entity: 'supplier', entityId: record.id });
    return record;
  },

  async listSuppliers(organizationId: string, filters?: { category?: string; country?: string; riskLevel?: string; status?: string; search?: string }): Promise<SupplierRecord[]> {
    let sql = `SELECT * FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    let idx = 2;
    if (filters?.category) { sql += ` AND category = $${idx++}`; params.push(filters.category); }
    if (filters?.country) { sql += ` AND country = $${idx++}`; params.push(filters.country); }
    if (filters?.riskLevel) { sql += ` AND risk_level = $${idx++}`; params.push(filters.riskLevel); }
    if (filters?.status) { sql += ` AND status = $${idx++}`; params.push(filters.status); }
    if (filters?.search) { sql += ` AND (name ILIKE $${idx++} OR code ILIKE $${idx++} OR description ILIKE $${idx++})`; const s = `%${filters.search}%`; params.push(s, s, s); }
    sql += ` ORDER BY updated_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierRecord>);
  },

  async getSupplier(id: string, organizationId: string): Promise<SupplierRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM suppliers WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Supplier not found');
    return mapRow<SupplierRecord>(rows[0]);
  },

  async updateSupplier(id: string, organizationId: string, input: Partial<SupplierRecord>, actorId?: string | null): Promise<SupplierRecord> {
    const existing = await this.getSupplier(id, organizationId);
    const updated: SupplierRecord = { ...existing, ...input, id, organizationId, updatedAt: new Date().toISOString() };
    await query(`UPDATE suppliers SET name=$2, code=$3, description=$4, category=$5, industry=$6, country=$7, region=$8, city=$9, address=$10, contact_name=$11, contact_email=$12, contact_phone=$13, website=$14, tax_id=$15, registration_number=$16, business_unit=$17, status=$18, risk_level=$19, esg_score=$20, carbon_score=$21, compliance_rate=$22, updated_at=$23 WHERE id=$1`, [id, updated.name, updated.code, updated.description, updated.category, updated.industry, updated.country, updated.region, updated.city, JSON.stringify(updated.address ?? {}), updated.contactName, updated.contactEmail, updated.contactPhone, updated.website, updated.taxId, updated.registrationNumber, updated.businessUnit, updated.status, updated.riskLevel, updated.esgScore, updated.carbonScore, updated.complianceRate, updated.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier.update', entity: 'supplier', entityId: id });
    return updated;
  },

  async deleteSupplier(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE suppliers SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier.delete', entity: 'supplier', entityId: id });
  },

  async getSupplierStats(organizationId: string): Promise<{ total: number; highRisk: number; active: number; avgEsgScore: number; avgCarbonScore: number; avgComplianceRate: number; byCountry: Record<string, number>; byIndustry: Record<string, number>; byRiskLevel: Record<string, number> }> {
    const { rows: statsRow } = await query<Record<string, any>>(`SELECT COUNT(*) as total, COALESCE(SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END), 0) as high_risk, COALESCE(SUM(CASE WHEN risk_level = 'critical' THEN 1 ELSE 0 END), 0) as critical_risk, COALESCE(AVG(esg_score), 0) as avg_esg, COALESCE(AVG(carbon_score), 0) as avg_carbon, COALESCE(AVG(compliance_rate), 0) as avg_compliance FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE`, [organizationId]);
    const row = statsRow[0];
    const { rows: countryRows } = await query<Record<string, any>>(`SELECT country, COUNT(*) as count FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE AND country IS NOT NULL GROUP BY country ORDER BY count DESC`, [organizationId]);
    const { rows: industryRows } = await query<Record<string, any>>(`SELECT industry, COUNT(*) as count FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE AND industry IS NOT NULL GROUP BY industry ORDER BY count DESC`, [organizationId]);
    const { rows: riskRows } = await query<Record<string, any>>(`SELECT risk_level, COUNT(*) as count FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE GROUP BY risk_level`, [organizationId]);
    return { total: row.total, highRisk: row.high_risk + row.critical_risk, active: row.total, avgEsgScore: Math.round(row.avg_esg), avgCarbonScore: Math.round(row.avg_carbon), avgComplianceRate: Math.round(row.avg_compliance), byCountry: Object.fromEntries(countryRows.map((r: any) => [r.country, r.count])), byIndustry: Object.fromEntries(industryRows.map((r: any) => [r.industry, r.count])), byRiskLevel: Object.fromEntries(riskRows.map((r: any) => [r.risk_level, r.count])) };
  },

  async getSupplierRanking(organizationId: string): Promise<SupplierRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM suppliers WHERE organization_id = $1 AND is_deleted = FALSE ORDER BY esg_score DESC NULLS LAST`, [organizationId]);
    return rows.map(mapRow<SupplierRecord>);
  },

  async getSupplierFacilities(supplierId: string, organizationId: string): Promise<SupplierFacilityRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_facilities WHERE supplier_id = $1 AND organization_id = $2 AND is_deleted = FALSE ORDER BY created_at DESC`, [supplierId, organizationId]);
    return rows.map(mapRow<SupplierFacilityRecord>);
  },

  async createFacility(supplierId: string, organizationId: string, input: Partial<SupplierFacilityRecord> & { name: string; facilityType: string }, actorId?: string | null): Promise<SupplierFacilityRecord> {
    const record: SupplierFacilityRecord = { id: randomUUID(), organizationId, supplierId, name: input.name, facilityType: input.facilityType as any, address: input.address ?? null, city: input.city ?? null, region: input.region ?? null, country: input.country ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    await query(`INSERT INTO supplier_facilities (id, organization_id, supplier_id, name, facility_type, address, city, region, country, latitude, longitude, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [record.id, record.organizationId, record.supplierId, record.name, record.facilityType, JSON.stringify(record.address ?? {}), record.city, record.region, record.country, record.latitude, record.longitude, record.isActive, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_facility.create', entity: 'supplier_facility', entityId: record.id });
    return record;
  },
};