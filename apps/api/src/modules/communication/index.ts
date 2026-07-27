import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { conversationRepo } from '../../repositories/conversation.repo.js';
import { conversationParticipantRepo } from '../../repositories/conversation.repo.js';
import { messageRepo } from '../../repositories/message.repo.js';

export interface CommunicationMessage {
  id: string;
  organizationId: string;
  conversationId?: string;
  senderId?: string;
  recipientId?: string;
  type: string;
  category: string;
  priority: string;
  subject?: string;
  body: string;
  channel: string;
  channels: string[];
  locale: string;
  attachments: any[];
  metadata: Record<string, unknown>;
  encrypted: boolean;
  readAt?: string;
  deliveredAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  title?: string;
  type: string;
  category?: string;
  isEncrypted: boolean;
  isArchived: boolean;
  metadata: Record<string, unknown>;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export const communicationService = {
  async listMessages(orgId: string, userId: string, filters: { conversationId?: string; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    if (filters.conversationId) {
      return messageRepo.listByConversation(filters.conversationId, filters.limit, filters.offset);
    }
    return messageRepo.listByRecipient(orgId, userId, filters.limit, filters.offset);
  },

  async createMessage(orgId: string, senderId: string, input: Partial<CommunicationMessage> & { body: string }) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return messageRepo.create({ organizationId: orgId, senderId, ...input });
  },

  async getConversation(id: string) {
    return conversationRepo.findById(id);
  },

  async listConversations(orgId: string, userId: string, filters: { type?: string; category?: string; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const conversations = await conversationRepo.listByOrganization(orgId, filters);
    const participants = await conversationParticipantRepo.listByUser(orgId, userId);
    const participantConversationIds = new Set(participants.map((p) => p.conversationId));
    return conversations.filter((c) => participantConversationIds.has(c.id) || c.type === 'channel');
  },

  async createConversation(orgId: string, userId: string, input: { title?: string; type?: string; category?: string; participantIds?: string[] }) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const conversation = await conversationRepo.create({ organizationId: orgId, title: input.title, type: input.type ?? 'direct', category: input.category, createdById: userId });
    await conversationParticipantRepo.create({ conversationId: conversation.id, organizationId: orgId, userId, role: 'owner' });
    if (input.participantIds) {
      for (const pid of input.participantIds) {
        await conversationParticipantRepo.create({ conversationId: conversation.id, organizationId: orgId, userId: pid, role: 'member' });
      }
    }
    await audit({ organizationId: orgId, actorId: userId, action: 'conversation.create', entity: 'conversation', entityId: conversation.id });
    return conversation;
  },

  async archiveConversation(orgId: string, id: string) {
    const conversation = await conversationRepo.findById(id);
    if (!conversation || conversation.organizationId !== orgId) throw new NotFoundError('Conversation not found');
    const updated = await conversationRepo.update(id, { isArchived: true });
    await audit({ organizationId: orgId, action: 'conversation.archive', entity: 'conversation', entityId: id });
    return updated;
  },

  async getInbox(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const messages = await messageRepo.listByRecipient(orgId, userId, 50, 0);
    const conversations = await conversationParticipantRepo.listByUser(orgId, userId);
    return {
      messages,
      conversations: conversations.map((p) => ({
        id: p.conversationId,
        role: p.role,
        lastReadMessageId: p.lastReadMessageId,
        isMuted: p.isMuted,
      })),
    };
  },
};
