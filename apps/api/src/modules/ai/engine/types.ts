/**
 * AI Engine — core types for the Sprint 5A AI foundation.
 *
 * These types power the provider abstraction, chat/completion, embeddings,
 * token accounting, caching, streaming, rate limiting and the job queue.
 * They are intentionally decoupled from the legacy complaint-insight
 * capabilities found in `./types.ts`.
 */

export type AiProviderKind = 'openai' | 'anthropic' | 'gemini' | 'azure' | 'ollama' | 'null';
export type EmbeddingProviderKind = 'openai' | 'azure' | 'ollama' | 'null';

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  stream?: boolean;
  jsonMode?: boolean;
  userId?: string | null;
  organizationId?: string | null;
  jobId?: string | null;
  requestId?: string | null;
  /** Skip the response cache even when enabled. */
  skipCache?: boolean;
  /** Conversation id used for token accounting attribution. */
  conversationId?: string;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CompletionResult {
  text: string;
  model: string;
  provider: AiProviderKind;
  usage: UsageInfo;
  cached: boolean;
  requestId?: string | null;
  finishReason?: string | null;
  /** Parsed JSON when jsonMode was requested and parsing succeeds. */
  json?: unknown;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  provider: EmbeddingProviderKind;
  tokens: number;
}

/** Streaming chunk delivered to callers of `stream()`. */
export interface StreamChunk {
  delta: string;
  done: boolean;
  finishReason?: string;
  usage?: UsageInfo;
}

export type StreamHandler = (chunk: StreamChunk) => void;

/** Response contract for an AI provider adapter. */
export interface ChatProvider {
  readonly kind: AiProviderKind;
  readonly displayName: string;
  /** Whether the provider is configured with usable credentials. */
  isConfigured(): boolean;
  /** Non-streaming completion. */
  complete(messages: ChatMessage[], options: CompletionOptions): Promise<CompletionResult>;
  /** Streaming completion. Returns once the stream finishes; handler receives chunks. */
  stream(messages: ChatMessage[], options: CompletionOptions, onChunk: StreamHandler): Promise<CompletionResult>;
}

export interface EmbeddingProvider {
  readonly kind: EmbeddingProviderKind;
  readonly displayName: string;
  isConfigured(): boolean;
  embed(texts: string[], model?: string): Promise<EmbeddingResult[]>;
  readonly dimensions: number;
}

/** Standard per-token pricing (USD) used for cost tracking. */
export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
  embeddingPer1k?: number;
}
