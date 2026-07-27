import { NotFoundError } from '../core/errors.js';
import { workerDirectoryRepo } from '../repositories/worker-directory.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const workerDirectoryService = {
  async search(orgId: string, params: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerDirectoryRepo.search(orgId, params as any);
  },
};
