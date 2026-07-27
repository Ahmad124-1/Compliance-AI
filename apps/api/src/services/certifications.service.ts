import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierCertificationRecord } from '../modules/certifications/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const certificationService = {
  async createCertification(organizationId: string, supplierId: string, input: Partial<SupplierCertificationRecord> & { certificationName: string; certificationType: string }, actorId?: string | null): Promise<SupplierCertificationRecord> {
    const record: SupplierCertificationRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      certificationName: input.certificationName,
      certificationType: input.certificationType as any,
      certificationBody: input.certificationBody ?? null,
      certificateNumber: input.certificateNumber ?? null,
      issueDate: input.issueDate ?? null,
      expiryDate: input.expiryDate ?? null,
      renewalDate: input.renewalDate ?? null,
      status: 'active',
      verificationStatus: 'pending',
      evidence: input.evidence ?? [],
      scope: input.scope ?? null,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO supplier_certifications (id, organization_id, supplier_id, certification_name, certification_type, certification_body, certificate_number, issue_date, expiry_date, renewal_date, status, verification_status, evidence, scope, notes, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`, [record.id, record.organizationId, record.supplierId, record.certificationName, record.certificationType, record.certificationBody, record.certificateNumber, record.issueDate, record.expiryDate, record.renewalDate, record.status, record.verificationStatus, JSON.stringify(record.evidence), record.scope, record.notes, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_certification.create', entity: 'supplier_certification', entityId: record.id });
    return record;
  },

  async listCertifications(organizationId: string, supplierId?: string, filters?: { certificationType?: string; status?: string }): Promise<SupplierCertificationRecord[]> {
    let sql = `SELECT * FROM supplier_certifications WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    if (supplierId) { sql += ` AND supplier_id = $2`; params.push(supplierId); }
    if (filters?.certificationType) { sql += ` AND certification_type = $3`; params.push(filters.certificationType); }
    if (filters?.status) { sql += ` AND status = $4`; params.push(filters.status); }
    sql += ` ORDER BY created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierCertificationRecord>);
  },

  async getCertification(id: string, organizationId: string): Promise<SupplierCertificationRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_certifications WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Certification not found');
    const row = mapRow<SupplierCertificationRecord>(rows[0]);
    row.evidence = typeof row.evidence === 'string' ? JSON.parse(row.evidence) : (row.evidence ?? []);
    return row;
  },

  async verifyCertification(id: string, organizationId: string, status: string, actorId?: string | null): Promise<SupplierCertificationRecord> {
    const existing = await this.getCertification(id, organizationId);
    const updated = { ...existing, verificationStatus: status as any, updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_certifications SET verification_status=$2, updated_at=NOW() WHERE id=$1`, [id, status]);
    await audit({ organizationId, actorId: actorId ?? null, action: `supplier_certification.verify`, entity: 'supplier_certification', entityId: id });
    return this.getCertification(id, organizationId);
  },

  async updateCertificationStatus(id: string, organizationId: string, status: string, actorId?: string | null): Promise<SupplierCertificationRecord> {
    const existing = await this.getCertification(id, organizationId);
    const updated = { ...existing, status: status as any, updatedAt: new Date().toISOString() };
    await query(`UPDATE supplier_certifications SET status=$2, updated_at=NOW() WHERE id=$1`, [id, status]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_certification.update', entity: 'supplier_certification', entityId: id });
    return this.getCertification(id, organizationId);
  },

  async deleteCertification(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_certifications SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_certification.delete', entity: 'supplier_certification', entityId: id });
  },

  async getExpiringCertifications(organizationId: string, daysAhead: number = 90): Promise<SupplierCertificationRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_certifications WHERE organization_id = $1 AND is_deleted = FALSE AND expiry_date IS NOT NULL AND expiry_date <= NOW() + INTERVAL '${daysAhead} days' AND status = 'active' ORDER BY expiry_date ASC`, [organizationId]);
    return rows.map(mapRow<SupplierCertificationRecord>);
  },
};