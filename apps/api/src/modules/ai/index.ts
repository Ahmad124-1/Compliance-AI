/**
 * AI module barrel (Sprint 5A).
 *
 * Re-exports the engine (providers, config, embeddings, jobs, accounting),
 * the knowledge base, vector search, RAG pipeline, memory and chat services.
 */
export * from './engine/index.js';
export * from './knowledge/types.js';
export * from './knowledge/repository.js';
export * from './knowledge/service.js';
export * from './knowledge/seed.js';
export * from './vector/repository.js';
export * from './vector/service.js';
export * from './rag/pipeline.js';
export * from './memory/repository.js';
export * from './memory/service.js';
export * from './chat.service.js';

// Preserve the legacy complaint-insight surface for backward compatibility.
export * from './types.js';
export * from './interfaces.js';
export * from './config.js';
export { aiContainer } from './container.js';
export { createAiProvider, defaultAiProvider } from './factory.js';
export { aiService } from './service.js';
// Avoid ambiguity with the engine barrel: re-export these explicitly.
export type { AiProviderKind, EmbeddingProviderKind, AiConfig } from './engine/index.js';

