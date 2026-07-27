import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { broadcastRepo } from '../../repositories/broadcast.repo.js';
import { broadcastRecipientRepo } from '../../repositories/broadcast.repo.js';

export interface BroadcastInput {
  senderId?: string;
  title: string;
  body: string;
  broadcastType?: string;
  priority?: string;
  scope?: Record<string, unknown>;
  channels?: string[];
  locale?: string;
  attachments?: any[];
  acknowledgementRequired?: boolean;
  readTracking?: boolean;
  expiryDate?: string;
  pinned?: boolean;
  scheduledAt?: string;
}

export const broadcastService = {
  async create(orgId: string, userId: string | undefined, input: BroadcastInput) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const rest = input;
    const broadcast = await broadcastRepo.create({ organizationId: orgId, senderId: userId, ...rest });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'broadcast.create', entity: 'broadcast', entityId: broadcast.id });
    return broadcast;
  },

  async list(orgId: string, filters: { broadcastType?: string; priority?: string; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return broadcastRepo.listByOrganization(orgId, filters);
  },

  async get(orgId: string, id: string) {
    const broadcast = await broadcastRepo.findById(id);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    const recipients = await broadcastRecipientRepo.listByBroadcast(id);
    return { ...broadcast, recipients };
  },

  async send(orgId: string, id: string, recipientIds: string[], channel = 'in_app') {
    const broadcast = await broadcastRepo.findById(id);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    await broadcastRecipientRepo.bulkCreate(id, orgId, recipientIds, channel);
    const sent = await broadcastRepo.markSent(id);
    await audit({ organizationId: orgId, action: 'broadcast.send', entity: 'broadcast', entityId: id });
    return sent ?? broadcast;
  },

  async acknowledge(orgId: string, broadcastId: string, userId: string) {
    const broadcast = await broadcastRepo.findById(broadcastId);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    let recipient = await broadcastRecipientRepo.getByUserAndBroadcast(broadcastId, userId);
    if (!recipient) {
      recipient = await broadcastRecipientRepo.create({ broadcastId, organizationId: orgId, userId, channel: 'in_app' });
    }
    const updatedRecipient = await broadcastRecipientRepo.updateStatus(recipient.id, {
      status: 'acknowledged',
      acknowledgedAt: new Date().toISOString(),
    });
    const allRecipients = await broadcastRecipientRepo.listByBroadcast(broadcastId);
    await audit({ organizationId: orgId, actorId: userId, action: 'broadcast.acknowledge', entity: 'broadcast', entityId: broadcastId });
    return updatedRecipient ?? recipient;
  },

  async markRead(orgId: string, broadcastId: string, userId: string) {
    const broadcast = await broadcastRepo.findById(broadcastId);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    let recipient = await broadcastRecipientRepo.getByUserAndBroadcast(broadcastId, userId);
    if (!recipient) {
      await broadcastRecipientRepo.create({ broadcastId, organizationId: orgId, userId, channel: 'in_app' });
      recipient = await broadcastRecipientRepo.getByUserAndBroadcast(broadcastId, userId);
    }
    const updated = await broadcastRecipientRepo.updateStatus(recipient!.id, { status: 'read', readAt: new Date().toISOString() });
    await audit({ organizationId: orgId, actorId: userId, action: 'broadcast.read', entity: 'broadcast', entityId: broadcastId });
    return updated;
  },

  async update(orgId: string, id: string, patch: { title?: string; body?: string; pinned?: boolean; expiryDate?: string }) {
    const broadcast = await broadcastRepo.findById(id);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    const updated = await broadcastRepo.update(id, patch);
    await audit({ organizationId: orgId, action: 'broadcast.update', entity: 'broadcast', entityId: id });
    return updated;
  },

  async delete(orgId: string, id: string) {
    const broadcast = await broadcastRepo.findById(id);
    if (!broadcast || broadcast.organizationId !== orgId) throw new NotFoundError('Broadcast not found');
    await broadcastRepo.delete(id);
    await audit({ organizationId: orgId, action: 'broadcast.delete', entity: 'broadcast', entityId: id });
  },
};
