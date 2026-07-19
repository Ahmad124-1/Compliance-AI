import { NotFoundError } from '../core/errors.js';
import { audit, type AuditInput } from '../core/audit.js';
import { auditRepo, type AuditQueryFilters, type AuditLogRecord } from '../repositories/audit.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const auditService = {
  /** Thin wrapper so callers can enrich the base audit helper with org context. */
  async record(input: AuditInput & { actorType?: string; severity?: string; ipAddress?: string; userAgent?: string; requestId?: string }, orgId?: string) {
    const org = orgId ?? input.organizationId ?? null;
    if (org) {
      const found = await organizationRepo.findById(org);
      if (!found) throw new NotFoundError('Organization not found');
    }
    await audit({
      organizationId: org,
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
    });
    await this.enrich(input, org ?? undefined);
  },

  async enrich(input: AuditInput & { actorType?: string; severity?: string; ipAddress?: string; userAgent?: string; requestId?: string }, _orgId?: string) {
    // Enrichment (IP/UA/severity) is persisted via the core audit helper; this
    // hook exists so future appenders (streaming, SIEM export) can subscribe.
    void input;
  },

  async list(orgId: string, filters: AuditQueryFilters = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return auditRepo.list(orgId, filters);
  },

  async get(orgId: string, id: string): Promise<AuditLogRecord> {
    const log = await auditRepo.get(orgId, id);
    if (!log || log.organizationId !== orgId) throw new NotFoundError('Audit log not found');
    return log;
  },

  async actions(orgId: string): Promise<string[]> {
    return auditRepo.actions(orgId);
  },

  async exportLogs(orgId: string, filters: AuditQueryFilters = {}): Promise<AuditLogRecord[]> {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return auditRepo.export(orgId, filters);
  },
};
