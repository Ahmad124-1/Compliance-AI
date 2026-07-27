import { randomUUID } from 'node:crypto';

import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { query } from '../db/pool.js';
import type { SupplierAuditRecord, AuditFinding, AuditEvidence, AuditPhoto, AuditDocument, AuditCapa, AuditApproval, AuditHistoryRecord } from '../modules/supplier-audits/types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const supplierAuditService = {
  async createAudit(organizationId: string, supplierId: string, input: Partial<SupplierAuditRecord> & { title: string; auditType: string }, actorId?: string | null): Promise<SupplierAuditRecord> {
    const record: SupplierAuditRecord = {
      id: randomUUID(),
      organizationId,
      supplierId,
      title: input.title,
      description: input.description ?? null,
      auditType: input.auditType as any,
      status: 'planned',
      findings: [],
      evidence: [],
      photos: [],
      documents: [],
      capas: [],
      approvals: [],
      auditorId: input.auditorId ?? null,
      auditorName: input.auditorName ?? null,
      auditDate: input.auditDate ?? null,
      dueDate: input.dueDate ?? null,
      completedAt: null,
      version: 1,
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO supplier_audits (id, organization_id, supplier_id, title, description, audit_type, status, findings, evidence, photos, documents, capas, approvals, auditor_id, auditor_name, audit_date, due_date, version, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`, [record.id, record.organizationId, record.supplierId, record.title, record.description, record.auditType, record.status, JSON.stringify(record.findings), JSON.stringify(record.evidence), JSON.stringify(record.photos), JSON.stringify(record.documents), JSON.stringify(record.capas), JSON.stringify(record.approvals), record.auditorId, record.auditorName, record.auditDate, record.dueDate, record.version, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_audit.create', entity: 'supplier_audit', entityId: record.id });
    return record;
  },

  async listAudits(organizationId: string, supplierId?: string): Promise<SupplierAuditRecord[]> {
    let sql = `SELECT * FROM supplier_audits WHERE organization_id = $1 AND is_deleted = FALSE`;
    const params: unknown[] = [organizationId];
    if (supplierId) { sql += ` AND supplier_id = $2`; params.push(supplierId); }
    sql += ` ORDER BY created_at DESC`;
    const { rows } = await query<Record<string, any>>(sql, params);
    return rows.map(mapRow<SupplierAuditRecord>);
  },

  async getAudit(id: string, organizationId: string): Promise<SupplierAuditRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM supplier_audits WHERE id = $1 AND organization_id = $2 AND is_deleted = FALSE`, [id, organizationId]);
    if (!rows[0]) throw new NotFoundError('Audit not found');
    const row = mapRow<SupplierAuditRecord>(rows[0]);
    row.findings = typeof row.findings === 'string' ? JSON.parse(row.findings) : (row.findings ?? []);
    row.evidence = typeof row.evidence === 'string' ? JSON.parse(row.evidence) : (row.evidence ?? []);
    row.photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos ?? []);
    row.documents = typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents ?? []);
    row.capas = typeof row.capas === 'string' ? JSON.parse(row.capas) : (row.capas ?? []);
    row.approvals = typeof row.approvals === 'string' ? JSON.parse(row.approvals) : (row.approvals ?? []);
    row.history = Array.isArray(row.history) ? row.history : [];
    return row;
  },

  async updateAuditStatus(id: string, organizationId: string, status: string, actorId?: string | null): Promise<SupplierAuditRecord> {
    const existing = await this.getAudit(id, organizationId);
    const updated = { ...existing, status: status as any, updatedAt: new Date().toISOString() };
    if (status === 'completed') updated.completedAt = new Date().toISOString();
    await query(`UPDATE supplier_audits SET status=$2, completed_at=$3, updated_at=NOW() WHERE id=$1`, [id, updated.status, updated.completedAt ?? null]);
    const historyEntry: AuditHistoryRecord = { id: randomUUID(), auditId: id, action: `audit.${status}`, actorId: actorId ?? null, actorName: null, details: `Audit status changed to ${status}`, createdAt: new Date().toISOString() };
    await query(`UPDATE supplier_audits SET history = COALESCE(history, '[]'::jsonb) || $2::jsonb WHERE id = $1`, [id, JSON.stringify([historyEntry])]);
    await audit({ organizationId, actorId: actorId ?? null, action: `supplier_audit.${status}`, entity: 'supplier_audit', entityId: id });
    return this.getAudit(id, organizationId);
  },

  async addFinding(auditId: string, organizationId: string, finding: AuditFinding, actorId?: string | null): Promise<SupplierAuditRecord> {
    const existing = await this.getAudit(auditId, organizationId);
    const findings = [...existing.findings, finding];
    await query(`UPDATE supplier_audits SET findings=$2, updated_at=NOW() WHERE id=$1`, [auditId, JSON.stringify(findings)]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_audit.finding.add', entity: 'supplier_audit', entityId: auditId });
    return this.getAudit(auditId, organizationId);
  },

  async addEvidence(auditId: string, organizationId: string, evidence: AuditEvidence, actorId?: string | null): Promise<SupplierAuditRecord> {
    const existing = await this.getAudit(auditId, organizationId);
    const evidenceList = [...existing.evidence, evidence];
    await query(`UPDATE supplier_audits SET evidence=$2, updated_at=NOW() WHERE id=$1`, [auditId, JSON.stringify(evidenceList)]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_audit.evidence.add', entity: 'supplier_audit', entityId: auditId });
    return this.getAudit(auditId, organizationId);
  },

  async addApproval(auditId: string, organizationId: string, approval: AuditApproval, actorId?: string | null): Promise<SupplierAuditRecord> {
    const existing = await this.getAudit(auditId, organizationId);
    const approvals = [...existing.approvals, approval];
    await query(`UPDATE supplier_audits SET approvals=$2, updated_at=NOW() WHERE id=$1`, [auditId, JSON.stringify(approvals)]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_audit.approval.add', entity: 'supplier_audit', entityId: auditId });
    return this.getAudit(auditId, organizationId);
  },

  async deleteAudit(id: string, organizationId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE supplier_audits SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'supplier_audit.delete', entity: 'supplier_audit', entityId: id });
  },
};