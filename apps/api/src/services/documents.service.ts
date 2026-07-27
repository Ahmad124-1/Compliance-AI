import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerDocumentRepo } from '../repositories/worker-document.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const documentsService = {
  async list(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerDocumentRepo.findByUserId(orgId, userId);
  },

  async get(orgId: string, id: string) {
    const doc = await workerDocumentRepo.findById(orgId, id);
    if (!doc) throw new NotFoundError('Document not found');
    return doc;
  },

  async create(orgId: string, userId: string, input: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const doc = await workerDocumentRepo.create({ organizationId: orgId, userId, ...(input as any) });
    await audit({ organizationId: orgId, actorId: userId, action: 'document.create', entity: 'worker_document', entityId: doc.id });
    return doc;
  },

  async download(orgId: string, id: string) {
    const doc = await workerDocumentRepo.incrementDownload(orgId, id);
    if (!doc) throw new NotFoundError('Document not found');
    await audit({ organizationId: orgId, action: 'document.download', entity: 'worker_document', entityId: id });
    return doc;
  },
};
