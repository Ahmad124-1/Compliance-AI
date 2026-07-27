import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerLearningRepo } from '../repositories/worker-learning.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const learningService = {
  async list(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerLearningRepo.findByUserId(orgId, userId);
  },

  async get(orgId: string, id: string) {
    const item = await workerLearningRepo.findById(orgId, id);
    if (!item) throw new NotFoundError('Learning item not found');
    return item;
  },

  async enroll(orgId: string, userId: string, input: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const item = await workerLearningRepo.create({ organizationId: orgId, userId, ...(input as any) });
    await audit({ organizationId: orgId, actorId: userId, action: 'learning.enroll', entity: 'worker_learning', entityId: item.id });
    return item;
  },

  async updateProgress(orgId: string, id: string, status: string, progress?: number, score?: number | null) {
    const item = await workerLearningRepo.updateStatus(orgId, id, status, progress, score);
    if (!item) throw new NotFoundError('Learning item not found');
    await audit({ organizationId: orgId, action: 'learning.progress', entity: 'worker_learning', entityId: id, metadata: { status, progress, score } });
    return item;
  },
};
