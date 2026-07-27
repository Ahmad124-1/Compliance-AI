import { randomUUID } from 'node:crypto';
import { audit } from '../../core/audit.js';
import { NotFoundError } from '../../core/errors.js';
import { query } from '../../db/pool.js';
import { memoryService } from '../ai/memory/service.js';
import { messageRepo } from '../../repositories/message.repo.js';
import { conversationRepo } from '../../repositories/conversation.repo.js';
import { conversationParticipantRepo } from '../../repositories/conversation.repo.js';

export interface Conversation {
  id: string;
  organizationId: string;
  userId: string | null;
  title: string;
  type: string;
  category?: string;
  pinned: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const chatModuleService = {
  async createConversation(organizationId: string, userId: string | null, title: string, type = 'group', category?: string): Promise<any> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const conversation = await conversationRepo.create({ organizationId, title, type, category, createdById: userId ?? undefined });
    if (userId) {
      await conversationParticipantRepo.create({ conversationId: conversation.id, organizationId, userId, role: 'owner' });
    }
    await audit({ organizationId, actorId: userId ?? null, action: 'conversation.create', entity: 'conversation', entityId: conversation.id });
    return { ...conversation, id };
  },

  async listConversations(organizationId: string, userId: string | null): Promise<any[]> {
    const conversations = await conversationRepo.listByOrganization(organizationId);
    if (userId) {
      const participants = await conversationParticipantRepo.listByUser(organizationId, userId);
      const participantIds = new Set(participants.map((p) => p.conversationId));
      return conversations.filter((c) => participantIds.has(c.id) || c.type === 'channel');
    }
    return conversations;
  },

  async getConversation(id: string): Promise<any> {
    const conversation = await conversationRepo.findById(id);
    if (!conversation) throw new NotFoundError('Conversation not found');
    const participants = await conversationParticipantRepo.listByConversation(id);
    return { ...conversation, participants };
  },

  async updateConversation(id: string, patch: Partial<{ title: string; isArchived: boolean; metadata: Record<string, unknown> }>) {
    const conversation = await conversationRepo.findById(id);
    if (!conversation) throw new NotFoundError('Conversation not found');
    const updated = await conversationRepo.update(id, patch);
    await audit({ organizationId: conversation.organizationId, action: 'conversation.update', entity: 'conversation', entityId: id });
    return updated;
  },

  async deleteConversation(id: string): Promise<void> {
    const conversation = await conversationRepo.findById(id);
    if (!conversation) throw new NotFoundError('Conversation not found');
    const messages = await messageRepo.listByConversation(id, 1000, 0);
    for (const msg of messages) {
      await memoryService.clearConversation(conversation.organizationId, msg.conversationId ?? '');
    }
    await conversationRepo.delete(id);
    await audit({ organizationId: conversation.organizationId, actorId: conversation.createdById ?? null, action: 'conversation.delete', entity: 'conversation', entityId: id });
  },

  async searchConversations(organizationId: string, queryStr: string): Promise<any[]> {
    const conversations = await conversationRepo.listByOrganization(organizationId);
    return conversations.filter((c) => (c.title ?? '').toLowerCase().includes(queryStr.toLowerCase()));
  },
};
