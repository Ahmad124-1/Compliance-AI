/**
 * AI Memory service — conversation, organisation, supplier and audit memory.
 *
 * Provides a single API for recording and retrieving memory used to ground
 * chat + RAG. Supplier and audit memory are auto-surfaced by the RAG pipeline
 * when the relevant entity is in context.
 */
import { memoryRepo, type MemoryRole, type MemoryScope } from './repository.js';

export const memoryService = {
  async record(input: {
    organizationId: string;
    scope: MemoryScope;
    scopeId?: string | null;
    role: MemoryRole;
    content: string;
    createdBy?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    return memoryRepo.append(input);
  },

  async conversationTurn(input: {
    organizationId: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    createdBy?: string | null;
  }) {
    return memoryRepo.append({
      organizationId: input.organizationId,
      scope: 'conversation',
      scopeId: input.conversationId,
      role: input.role,
      content: input.content,
      createdBy: input.createdBy ?? null,
    });
  },

  async getConversationMessages(organizationId: string, conversationId: string, systemPrompt?: string) {
    return memoryRepo.toMessages(organizationId, conversationId, systemPrompt);
  },

  async getOrganizationMemory(organizationId: string, limit = 30) {
    return memoryRepo.get('organization', organizationId, null, limit);
  },

  async getSupplierMemory(organizationId: string, supplierId: string, limit = 20) {
    return memoryRepo.get('supplier', organizationId, supplierId, limit);
  },

  async getAuditMemory(organizationId: string, auditId: string, limit = 20) {
    return memoryRepo.get('audit', organizationId, auditId, limit);
  },

  async clearConversation(organizationId: string, conversationId: string) {
    return memoryRepo.clearScope('conversation', organizationId, conversationId);
  },

  /** Compile up to `maxTokens` of relevant memory for RAG context. */
  async buildContext(organizationId: string, opts: {
    supplierId?: string;
    auditId?: string;
    maxTokens?: number;
  } = {}): Promise<string> {
    const parts: string[] = [];
    const org = await memoryRepo.get('organization', organizationId, null, 15);
    if (org.length) {
      parts.push(`## Organization Memory\n${org.map((m) => `- ${m.content}`).join('\n')}`);
    }
    if (opts.supplierId) {
      const sup = await memoryRepo.get('supplier', organizationId, opts.supplierId, 15);
      if (sup.length) parts.push(`## Supplier Memory\n${sup.map((m) => `- ${m.content}`).join('\n')}`);
    }
    if (opts.auditId) {
      const aud = await memoryRepo.get('audit', organizationId, opts.auditId, 15);
      if (aud.length) parts.push(`## Audit Memory\n${aud.map((m) => `- ${m.content}`).join('\n')}`);
    }
    let context = parts.join('\n\n');
    const max = opts.maxTokens ?? 2000;
    if (Math.ceil(context.length / 4) > max) {
      context = context.slice(0, max * 4);
    }
    return context;
  },
};
