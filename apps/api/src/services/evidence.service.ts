import { NotFoundError } from '../core/errors.js';
import { evidenceRepo } from '../repositories/evidence.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { audit } from '../core/audit.js';

export interface EvidenceInput {
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface EvidenceUploadResult {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  description: string | null;
  category: string | null;
  tags?: string[];
  createdAt: string;
}

export const evidenceService = {
  async addEvidenceToCase(orgId: string, caseId: string, input: EvidenceInput, actorId?: string): Promise<EvidenceUploadResult> {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');

    const evidence = await evidenceRepo.create({
      ...input,
      caseId,
      uploadedBy: actorId ?? null,
      tags: input.tags || [],
    });

    if (!evidence) throw new NotFoundError('Evidence not found');
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'evidence.create', entity: 'evidence', entityId: evidence.id });
    return evidence;
  },

  async getCaseEvidence(orgId: string, caseId: string) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return evidenceRepo.findByCaseId(caseId);
  },

  async getEvidenceById(orgId: string, evidenceId: string) {
    const evidence = await evidenceRepo.findById(evidenceId);
    if (!evidence || !evidence.caseId) throw new NotFoundError('Evidence not found');
    const case_ = await caseRepo.findById(evidence.caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Evidence not found');
    return evidence;
  },
};
