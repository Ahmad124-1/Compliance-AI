/**
 * AI Foundation — web domain types (Sprint 5A).
 *
 * Mirror of the API contracts for the new engine: config, providers, knowledge
 * base, vector search, RAG, memory, jobs and usage accounting.
 */
export type AiProviderKind = 'openai' | 'anthropic' | 'gemini' | 'azure' | 'ollama' | 'null';
export type EmbeddingProviderKind = 'openai' | 'azure' | 'ollama' | 'null';
export type KnowledgeDomain = 'policy' | 'audit' | 'capa' | 'grievance' | 'evidence' | 'supplier';
export type KnowledgeCategory = 'social' | 'quality' | 'environment' | 'energy' | 'esg' | 'legal' | 'custom';
export type JobType = 'embed' | 'summarize' | 'analyze' | 'generate' | 'rag' | 'translate' | 'index_kb';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export interface ProviderDescriptor {
  kind: string;
  label: string;
  chatConfigured: boolean;
  embeddingConfigured: boolean;
}

export interface AiModelCatalogue {
  [provider: string]: string[];
}

export interface AiCapabilitiesResponse {
  provider: AiProviderKind;
  embeddingProvider: EmbeddingProviderKind;
  model: string;
  embeddingModel: string;
  providers: ProviderDescriptor[];
  models: AiModelCatalogue;
  streamingEnabled: boolean;
  rag: { topK: number; minScore: number };
}

export interface AiConfig {
  organizationId: string;
  provider: AiProviderKind;
  embeddingProvider: EmbeddingProviderKind;
  model: string;
  embeddingModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  fallbackEnabled: boolean;
  fallbackOrder: string[];
  rateLimitRpm: number;
  rateLimitTpm: number;
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
  streamingEnabled: boolean;
  ragTopK: number;
  ragMinScore: number;
  systemPrompt: string | null;
  enableAudit: boolean;
  enableSupplier: boolean;
  enableCapa: boolean;
  enableGrievance: boolean;
  enableEvidence: boolean;
  enablePolicy: boolean;
}

export interface PromptTemplate {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  version: number;
  content: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeStandard {
  id: string;
  organizationId: string | null;
  code: string;
  name: string;
  publisher: string | null;
  category: KnowledgeCategory;
  jurisdiction: string | null;
  description: string | null;
  version: string | null;
  sourceUrl: string | null;
  isBuiltin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VectorSearchHit {
  id: string;
  sourceType: string;
  sourceId: string;
  domain: KnowledgeDomain | string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface RagContext {
  clauses: string[];
  capas: string[];
  audits: string[];
  suppliers: string[];
  grievances: string[];
  evidence: string[];
  vectorHits: Array<{ domain: string; content: string; score: number }>;
  memory: string;
}

export interface RagResult {
  context: RagContext;
  answer?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  cached?: boolean;
  provider?: string;
  model?: string;
}

export interface MemoryRecord {
  id: string;
  organizationId: string;
  scope: string;
  scopeId: string | null;
  role: string;
  content: string;
  tokens: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  organizationId: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  progress: number;
  provider: string | null;
  model: string | null;
  createdBy: string | null;
  scheduledFor: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageSummary {
  totalCostUsd: number;
  totalTokens: number;
  completionTokens: number;
  embeddingTokens: number;
  requestCount: number;
  byProvider: Record<string, { costUsd: number; tokens: number }>;
}

export interface UsageResponse {
  summary: UsageSummary;
  recent: Array<{
    id: string;
    provider: string;
    model: string;
    kind: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
    cached: boolean;
    createdAt: string;
  }>;
}

export interface ChatMessageTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
