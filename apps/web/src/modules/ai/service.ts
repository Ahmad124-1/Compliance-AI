import { aiApi } from './api.js';
import type {
  AiCapabilitiesResponse,
  AiConfig,
  PromptTemplate,
  KnowledgeStandard,
  VectorSearchHit,
  RagContext,
  RagResult,
  MemoryRecord,
  JobRecord,
  UsageResponse,
  ChatMessageTurn,
} from './types.js';

export const aiService = {
  capabilities: () => aiApi.capabilities(),
  providers: () => aiApi.providers(),

  getConfig: () => aiApi.getConfig(),
  updateConfig: (patch: Partial<AiConfig>) => aiApi.updateConfig(patch),

  listPrompts: () => aiApi.listPrompts(),
  createPrompt: (input: { key: string; name: string; content: string; description?: string | null; category?: string; variables?: string[]; isDefault?: boolean }) =>
    aiApi.createPrompt(input),
  renderPrompt: (key: string, variables: Record<string, unknown>, fallback?: string) =>
    aiApi.renderPrompt(key, variables, fallback),

  knowledgeStandards: () => aiApi.knowledgeStandards(),
  ingest: (input: Parameters<typeof aiApi.ingest>[0]) => aiApi.ingest(input),

  vectorSearch: (query: string, opts?: { domains?: string[]; limit?: number; minScore?: number }) =>
    aiApi.vectorSearch(query, opts),
  indexKb: () => aiApi.indexKb(),
  indexKbJob: () => aiApi.indexKbJob(),

  rag: (input: Parameters<typeof aiApi.rag>[0]) => aiApi.rag(input),
  ragContext: (query: string, opts?: { supplierId?: string; auditId?: string }) => aiApi.ragContext(query, opts),

  chat: (input: Parameters<typeof aiApi.chat>[0]) => aiApi.chat(input),

  memoryScope: (scope: string, scopeId?: string) => aiApi.memoryScope(scope, scopeId),
  writeMemory: (input: Parameters<typeof aiApi.writeMemory>[0]) => aiApi.writeMemory(input),

  jobs: (status?: string) => aiApi.jobs(status),
  jobStats: () => aiApi.jobStats(),
  enqueueJob: (type: Parameters<typeof aiApi.enqueueJob>[0], payload?: Record<string, unknown>, priority?: number) =>
    aiApi.enqueueJob(type, payload, priority),

  usage: (days?: number) => aiApi.usage(days),
};

export type {
  AiCapabilitiesResponse,
  AiConfig,
  PromptTemplate,
  KnowledgeStandard,
  VectorSearchHit,
  RagContext,
  RagResult,
  MemoryRecord,
  JobRecord,
  UsageResponse,
  ChatMessageTurn,
};
