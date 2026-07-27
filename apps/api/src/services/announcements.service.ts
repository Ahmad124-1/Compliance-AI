import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { announcementRepo } from '../repositories/announcement.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const announcementsService = {
  async list(orgId: string, filters: Record<string, unknown> = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return announcementRepo.listByOrganization(orgId, filters as any);
  },

  async get(orgId: string, id: string) {
    const announcement = await announcementRepo.findById(id);
    if (!announcement || announcement.organizationId !== orgId) throw new NotFoundError('Announcement not found');
    return announcement;
  },

  async create(orgId: string, userId: string | undefined, input: Record<string, unknown>) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const announcement = await announcementRepo.create({ organizationId: orgId, ...(input as any), createdById: userId });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'announcement.create', entity: 'announcement', entityId: announcement.id });
    return announcement;
  },

  async update(orgId: string, id: string, patch: Record<string, unknown>) {
    const announcement = await announcementRepo.findById(id);
    if (!announcement || announcement.organizationId !== orgId) throw new NotFoundError('Announcement not found');
    const updated = await announcementRepo.update(id, patch as any);
    if (!updated) throw new NotFoundError('Announcement update failed');
    await audit({ organizationId: orgId, action: 'announcement.update', entity: 'announcement', entityId: id });
    return updated;
  },

  async markRead(orgId: string, id: string, userId: string) {
    const announcement = await announcementRepo.findById(id);
    if (!announcement || announcement.organizationId !== orgId) throw new NotFoundError('Announcement not found');
    await announcementRepo.markRead(id, userId);
    await audit({ organizationId: orgId, actorId: userId, action: 'announcement.read', entity: 'announcement', entityId: id });
    return { success: true };
  },

  async acknowledge(orgId: string, id: string, userId: string) {
    const announcement = await announcementRepo.findById(id);
    if (!announcement || announcement.organizationId !== orgId) throw new NotFoundError('Announcement not found');
    await announcementRepo.markAcknowledged(id, userId);
    await audit({ organizationId: orgId, actorId: userId, action: 'announcement.acknowledge', entity: 'announcement', entityId: id });
    return { success: true };
  },
};
