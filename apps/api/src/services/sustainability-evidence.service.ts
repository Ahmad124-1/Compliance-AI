import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { sustainabilityEvidenceRepo } from '../repositories/sustainability-evidence.repo.js';

export const sustainabilityEvidenceService = {
  async listByEntity(orgId: string, entityType: string, entityId: string) {
    return sustainabilityEvidenceRepo.listByEntity(entityType, entityId, orgId);
  },

  async listByOrganization(orgId: string, filter?: Record<string, unknown>) {
    const page = (filter?.page as number) ?? 1;
    const limit = (filter?.limit as number) ?? 50;
    const offset = (page - 1) * limit;
    const evidences = await sustainabilityEvidenceRepo.listByOrganization(orgId, {
      entityType: filter?.entityType as string,
      entityId: filter?.entityId as string,
      evidenceType: filter?.evidenceType as string,
      approvalStatus: filter?.approvalStatus as string,
    });
    const total = evidences.length;
    const paginated = evidences.slice(offset, offset + limit);
    return { evidences: paginated, total, page, limit };
  },

  async create(orgId: string, input: Record<string, unknown>) {
    const evidence = await sustainabilityEvidenceRepo.create({
      organizationId: orgId,
      entityType: input.entityType as string,
      entityId: input.entityId as string,
      documentId: input.documentId as string | undefined,
      title: input.title as string,
      description: input.description as string | undefined,
      evidenceType: input.evidenceType as string,
      tags: (input.tags as string[]) ?? [],
      version: (input.version as number) ?? 1,
      expiryDate: input.expiryDate as string | undefined,
      uploadedBy: input.uploadedBy as string | undefined,
      aiExtractedData: (input.aiExtractedData as Record<string, unknown>) ?? {},
    });
    await audit({ action: 'sustainability.evidence.create', entity: 'sustainability_evidence', entityId: evidence.id });
    return evidence;
  },

  async update(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    for (const key of ['title', 'description', 'tags', 'expiryDate', 'approvalStatus', 'aiExtractedData']) {
      if (input[key] !== undefined) patch[key] = input[key];
    }
    const evidence = await sustainabilityEvidenceRepo.update(id, orgId, patch);
    if (!evidence) throw new NotFoundError('Evidence not found');
    await audit({ action: 'sustainability.evidence.update', entity: 'sustainability_evidence', entityId: id });
    return evidence;
  },

  async delete(orgId: string, id: string) {
    const existing = await sustainabilityEvidenceRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Evidence not found');
    await sustainabilityEvidenceRepo.softDelete(id, orgId);
    await audit({ action: 'sustainability.evidence.delete', entity: 'sustainability_evidence', entityId: id });
    return { success: true };
  },
};