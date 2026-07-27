import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AI_ENDPOINTS } from './constants.js';
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
  KnowledgeDomain,
  JobType,
  AiProviderKind,
  EmbeddingProviderKind,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export interface IngestInput {
  domain: KnowledgeDomain;
  title: string;
  content: string;
  standardId?: string;
  language?: string;
  metadata?: Record<string, unknown>;
  index?: boolean;
}

export interface RagInput {
  query: string;
  supplierId?: string;
  auditId?: string;
  grievanceId?: string;
  capaId?: string;
  domains?: string[];
  topK?: number;
  retrieveOnly?: boolean;
  stream?: boolean;
}

export const aiApi = {
  capabilities: () => http<AiCapabilitiesResponse>(AI_ENDPOINTS.capabilities),
  providers: () => http<AiCapabilitiesResponse>(AI_ENDPOINTS.providers),

  getConfig: () => http<AiConfig>(AI_ENDPOINTS.config),
  updateConfig: (patch: Partial<AiConfig>) =>
    http<AiConfig>(AI_ENDPOINTS.updateConfig, { method: 'PUT', body: JSON.stringify(patch) }),

  listPrompts: () => http<PromptTemplate[]>(AI_ENDPOINTS.prompts),
  createPrompt: (input: { key: string; name: string; content: string; description?: string | null; category?: string; variables?: string[]; isDefault?: boolean }) =>
    http<PromptTemplate>(AI_ENDPOINTS.createPrompt, { method: 'POST', body: JSON.stringify(input) }),
  renderPrompt: (key: string, variables: Record<string, unknown>, fallback?: string) =>
    http<{ rendered: string }>(AI_ENDPOINTS.renderPrompt, { method: 'POST', body: JSON.stringify({ key, variables, fallback }) }),

  knowledgeStandards: () => http<KnowledgeStandard[]>(AI_ENDPOINTS.knowledgeStandards),
  ingest: (input: IngestInput) =>
    http<{ entries: number }>(AI_ENDPOINTS.ingest, { method: 'POST', body: JSON.stringify(input) }),

  vectorSearch: (query: string, opts: { domains?: string[]; limit?: number; minScore?: number } = {}) => {
    const params = new URLSearchParams({ query, ...(opts.domains ? { domains: opts.domains.join(',') } : {}), ...(opts.limit ? { limit: String(opts.limit) } : {}), ...(opts.minScore ? { minScore: String(opts.minScore) } : {}) });
    return http<VectorSearchHit[]>(`${AI_ENDPOINTS.vectorSearch}?${params.toString()}`);
  },
  indexKb: () => http<{ indexed: number }>(AI_ENDPOINTS.indexKb, { method: 'POST' }),
  indexKbJob: () => http<JobRecord>(AI_ENDPOINTS.indexKbJob, { method: 'POST' }),

  rag: (input: RagInput) => http<RagResult>(AI_ENDPOINTS.rag, { method: 'POST', body: JSON.stringify(input) }),
  ragContext: (query: string, opts: { supplierId?: string; auditId?: string } = {}) => {
    const params = new URLSearchParams({ query, ...(opts.supplierId ? { supplierId: opts.supplierId } : {}), ...(opts.auditId ? { auditId: opts.auditId } : {}) });
    return http<RagContext>(`${AI_ENDPOINTS.ragContext}?${params.toString()}`);
  },

  chat: (input: { conversationId: string; message: string; supplierId?: string; auditId?: string; useRag?: boolean; systemPrompt?: string }) =>
    http<{ text: string; model: string; provider: string; usage?: RagResult['usage'] }>(AI_ENDPOINTS.chat, { method: 'POST', body: JSON.stringify(input) }),

  memoryScope: (scope: string, scopeId?: string) => {
    const params = scopeId ? new URLSearchParams({ scopeId }) : undefined;
    const url = params ? `${AI_ENDPOINTS.memoryScope(scope)}?${params.toString()}` : AI_ENDPOINTS.memoryScope(scope);
    return http<MemoryRecord[] | ChatMessageTurn[]>(url);
  },
  writeMemory: (input: { scope: string; scopeId?: string | null; role: string; content: string; metadata?: Record<string, unknown> }) =>
    http<MemoryRecord>(AI_ENDPOINTS.memory, { method: 'POST', body: JSON.stringify(input) }),

  jobs: (status?: string) => {
    const params = status ? new URLSearchParams({ status }) : undefined;
    const url = params ? `${AI_ENDPOINTS.jobs}?${params.toString()}` : AI_ENDPOINTS.jobs;
    return http<JobRecord[]>(url);
  },
  jobStats: () => http<Record<string, number>>(AI_ENDPOINTS.jobStats),
  enqueueJob: (type: JobType, payload: Record<string, unknown> = {}, priority?: number) =>
    http<JobRecord>(AI_ENDPOINTS.jobs, { method: 'POST', body: JSON.stringify({ type, payload, priority }) }),

  usage: (days?: number) => {
    const params = days ? new URLSearchParams({ days: String(days) }) : undefined;
    const url = params ? `${AI_ENDPOINTS.usage}?${params.toString()}` : AI_ENDPOINTS.usage;
    return http<UsageResponse>(url);
  },
};

export type { AiProviderKind, EmbeddingProviderKind };
