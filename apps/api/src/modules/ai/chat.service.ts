/**
 * Chat orchestration service.
 *
 * The high-level entry point for conversational AI. It:
 *   - resolves org AI config + provider (with automatic fallback)
 *   - loads conversation memory as the message history
 *   - optionally augments with RAG-retrieved context
 *   - streams or returns completions
 *   - records user/assistant turns to memory + token accounting
 */
import { aiConfigRepo } from './engine/config.repo.js';
import { createRegistry, resolveCredentials } from './engine/registry.js';
import { memoryService } from './memory/service.js';
import { ragService } from './rag/pipeline.js';
import { AiDisabledError } from './engine/providers/null.provider.js';
import type { ChatMessage, CompletionOptions, CompletionResult, StreamHandler } from './engine/types.js';

export interface ChatInput {
  organizationId: string;
  conversationId: string;
  message: string;
  userId?: string | null;
  supplierId?: string;
  auditId?: string;
  useRag?: boolean;
  stream?: boolean;
  systemPromptOverride?: string;
}

export const chatService = {
  async send(input: ChatInput): Promise<CompletionResult> {
    const config = await aiConfigRepo.get(input.organizationId);
    if (config.provider === 'null') throw new AiDisabledError();

    // Record the user turn.
    await memoryService.conversationTurn({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      role: 'user',
      content: input.message,
      createdBy: input.userId ?? null,
    });

    const systemPrompt = input.systemPromptOverride ?? config.systemPrompt ?? undefined;
    const history = await memoryService.getConversationMessages(input.organizationId, input.conversationId, systemPrompt);

    let augmentedUser = input.message;
    if (input.useRag && String(config.provider) !== 'null') {
      const rag = await ragService.run({
        organizationId: input.organizationId,
        query: input.message,
        supplierId: input.supplierId,
        auditId: input.auditId,
        userId: input.userId ?? null,
        conversationId: input.conversationId,
        retrieveOnly: true,
      });
      const ctx = [
        rag.context.clauses.join('\n'),
        rag.context.capas.join('\n'),
        rag.context.audits.join('\n'),
        rag.context.suppliers.join('\n'),
        rag.context.grievances.join('\n'),
        rag.context.evidence.join('\n'),
        rag.context.vectorHits.map((h) => h.content).join('\n'),
        rag.context.memory,
      ].filter(Boolean).join('\n').trim();
      if (ctx) augmentedUser = `${input.message}\n\n[Relevant context]\n${ctx}`;
    }

    const messages: ChatMessage[] = [
      ...history,
      { role: 'user', content: augmentedUser },
    ];
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId: input.organizationId, userId: input.userId ?? null });
    const opts: CompletionOptions = {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      conversationId: input.conversationId,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      stream: false,
      jsonMode: false,
    };

    let result: CompletionResult;
    if (input.stream) {
      const handler: StreamHandler = () => { /* route streams chunks directly */ };
      result = await registry.chatProvider().stream(messages, opts, handler);
    } else {
      result = await registry.withFallback((p) => p.complete(messages, opts));
    }

    await memoryService.conversationTurn({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      role: 'assistant',
      content: result.text,
      createdBy: input.userId ?? null,
    });

    return result;
  },

  /** Stream a chat response, invoking onChunk for each delta. */
  async stream(input: ChatInput, onChunk: StreamHandler): Promise<CompletionResult> {
    const config = await aiConfigRepo.get(input.organizationId);
    if (config.provider === 'null') throw new AiDisabledError();

    await memoryService.conversationTurn({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      role: 'user',
      content: input.message,
      createdBy: input.userId ?? null,
    });

    const systemPrompt = input.systemPromptOverride ?? config.systemPrompt ?? undefined;
    const history = await memoryService.getConversationMessages(input.organizationId, input.conversationId, systemPrompt);
    const messages: ChatMessage[] = [...history, { role: 'user', content: input.message }];
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId: input.organizationId, userId: input.userId ?? null });
    const opts: CompletionOptions = {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      conversationId: input.conversationId,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      stream: true,
      jsonMode: false,
    };
    const result = await registry.chatProvider().stream(messages, opts, onChunk);
    await memoryService.conversationTurn({
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      role: 'assistant',
      content: result.text,
      createdBy: input.userId ?? null,
    });
    return result;
  },
};
