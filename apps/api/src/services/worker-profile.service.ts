import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerProfileRepo } from '../repositories/worker-profile.repo.js';
import { userRepo } from '../repositories/user.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const workerProfileService = {
  async getProfile(orgId: string, userId: string) {
    const profile = await workerProfileRepo.findByUserId(orgId, userId);
    if (!profile) throw new NotFoundError('Worker profile not found');
    const user = await userRepo.findById(userId);
    if (!user || user.organizationId !== orgId) throw new NotFoundError('User not found');
    return { ...profile, email: user.email, firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, locale: user.locale };
  },

  async createOrUpdate(orgId: string, userId: string, patch: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const existing = await workerProfileRepo.findByUserId(orgId, userId);
    if (existing) {
      const updated = await workerProfileRepo.update(orgId, userId, patch as any);
      if (!updated) throw new NotFoundError('Profile update failed');
      await audit({ organizationId: orgId, actorId: userId, action: 'worker_profile.update', entity: 'worker_profile', entityId: updated.id });
      return updated;
    }
    const created = await workerProfileRepo.create({ organizationId: orgId, userId, ...(patch as any) } as any);
    await audit({ organizationId: orgId, actorId: userId, action: 'worker_profile.create', entity: 'worker_profile', entityId: created.id });
    return created;
  },

  async listByOrganization(orgId: string, filters: { departmentId?: string; siteId?: string } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return workerProfileRepo.listByOrganization(orgId, filters.departmentId, filters.siteId);
  },
};
