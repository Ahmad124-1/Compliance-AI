import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { recognitionRepo } from '../repositories/recognition.repo.js';
import { notificationService } from '../services/notification.service.js';

export const recognitionService = {
  async listTypes(orgId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return recognitionRepo.findTypes(orgId);
  },

  async createType(orgId: string, userId: string | undefined, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const type = await recognitionRepo.createType(input);
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'recognition.type.create', entity: 'recognition_type', entityId: type.id });
    return type;
  },

  async updateType(orgId: string, id: string, userId: string | undefined, patch: any) {
    const type = await recognitionRepo.findTypeById(orgId, id);
    if (!type) throw new NotFoundError('Recognition type not found');
    const updated = await recognitionRepo.updateType(orgId, id, patch);
    if (!updated) throw new NotFoundError('Recognition type update failed');
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'recognition.type.update', entity: 'recognition_type', entityId: id });
    return updated;
  },

  async listRecognitions(orgId: string, filters: { toUserId?: string; fromUserId?: string; category?: string; limit?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return recognitionRepo.findMany(orgId, filters);
  },

  async create(orgId: string, fromUserId: string, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const type = input.recognitionTypeId ? await recognitionRepo.findTypeById(orgId, input.recognitionTypeId) : null;
    const pointsAwarded = type ? type.pointsValue : 10;
    const recognition = await recognitionRepo.create({ organizationId: orgId, fromUserId, toUserId: input.toUserId, message: input.message, pointsAwarded, isManagerRecognition: input.isManagerRecognition ?? false, category: input.category || type?.category || 'peer', recognitionTypeId: input.recognitionTypeId || null });
    await recognitionRepo.createPoints({
      organizationId: orgId,
      userId: input.toUserId,
      recognitionId: recognition.id,
      points: pointsAwarded,
      reason: recognition.message,
    });
    await notificationService.createNotification({
      organizationId: orgId,
      userId: input.toUserId,
      type: 'status_update',
      channel: 'in_app',
      title: 'New Recognition',
      body: `You received ${pointsAwarded} points from a colleague.`,
      data: { recognitionId: recognition.id },
    });
    await audit({ organizationId: orgId, actorId: fromUserId, action: 'recognition.create', entity: 'recognition', entityId: recognition.id });
    return recognition;
  },

  async giveRecognition(orgId: string, fromUserId: string, input: any) {
    return this.create(orgId, fromUserId, input);
  },

  async getLeaderboard(orgId: string, period = 'month', siteId?: string, departmentId?: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return recognitionRepo.getLeaderboard(orgId, period, siteId, departmentId);
  },

  async getRecognitionHistory(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return recognitionRepo.findMany(orgId, { toUserId: userId });
  },

  async getMyPoints(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return recognitionRepo.getUserPoints(orgId, userId);
  },
};
