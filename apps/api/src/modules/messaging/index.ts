import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { messageRepo } from '../../repositories/message.repo.js';
import { notificationService } from '../../services/notification.service.js';

export interface MessagingInput {
  organizationId: string;
  senderId: string;
  recipientId?: string;
  conversationId?: string;
  type?: string;
  category?: string;
  priority?: string;
  subject?: string;
  body: string;
  channel?: string;
  channels?: string[];
  attachments?: any[];
  metadata?: Record<string, unknown>;
}

export const messagingService = {
  async send(input: MessagingInput) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const message = await messageRepo.create({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      senderId: input.senderId,
      recipientId: input.recipientId,
      type: input.type ?? 'direct',
      category: input.category ?? 'general',
      priority: input.priority ?? 'normal',
      subject: input.subject,
      body: input.body,
      channel: input.channel ?? 'in_app',
      channels: input.channels ?? [input.channel ?? 'in_app'],
      attachments: input.attachments ?? [],
      metadata: input.metadata ?? {},
    });

    if (input.channel && input.channel !== 'in_app') {
      await notificationService.createNotification({
        organizationId: input.organizationId,
        userId: input.recipientId ?? input.senderId,
        type: 'system',
        channel: input.channel,
        title: input.subject ?? 'New Message',
        body: input.body,
        data: { messageId: message.id },
      });
    }

    await audit({ organizationId: input.organizationId, actorId: input.senderId, action: 'message.send', entity: 'message', entityId: message.id });
    return message;
  },

  async getMessages(orgId: string, userId: string, filters: { conversationId?: string; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return messageRepo.listByConversation(filters.conversationId ?? '', filters.limit, filters.offset);
  },
};
