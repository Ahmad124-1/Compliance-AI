/**
 * Embeddings + semantic vector search service.
 *
 * Responsibilities:
 *   - embed text via the configured embedding provider (OpenAI/Azure/Ollama)
 *   - persist embeddings into `ai_embeddings` for any source type
 *   - embed a query and run similarity search across the six RAG domains
 *     (policy, audit, capa, grievance, evidence, supplier)
 */
import { createRegistry, resolveCredentials } from '../engine/registry.js';
import { aiConfigRepo, type AiConfig } from '../engine/config.repo.js';
import { query } from '../../../db/pool.js';
import { vectorRepo, type VectorDomain, type VectorSearchHit, type VectorSourceType } from './repository.js';
import { knowledgeRepo } from '../knowledge/repository.js';
import type { EmbeddingProvider } from '../engine/types.js';

export interface IndexInput {
  organizationId: string;
  sourceType: VectorSourceType;
  sourceId: string;
  domain: VectorDomain;
  content: string;
  metadata?: Record<string, unknown>;
  /** When true, old embeddings for this source are removed before re-index. */
  replace?: boolean;
}

export interface SearchOptions {
  organizationId: string;
  query: string;
  domains?: VectorDomain[];
  sourceTypes?: VectorSourceType[];
  limit?: number;
  minScore?: number;
}

function dimsFor(config: AiConfig, provider: EmbeddingProvider): number {
  return provider.dimensions;
}

export const vectorService = {
  /** Lazy provider resolution from org config. Falls back to platform creds. */
  async providerFor(organizationId: string, config?: AiConfig): Promise<EmbeddingProvider> {
    const cfg = config ?? (await aiConfigRepo.get(organizationId));
    const registry = createRegistry(cfg, { ...resolveCredentials(), organizationId });
    return registry.embeddingProvider();
  },

  /** Index a single text chunk. */
  async index(input: IndexInput): Promise<void> {
    const config = await aiConfigRepo.get(input.organizationId);
    const provider = await this.providerFor(input.organizationId, config);
    if (!provider.isConfigured()) return; // embedding disabled
    if (input.replace) await vectorRepo.deleteBySource(input.sourceType, input.sourceId);
    const [result] = await provider.embed([input.content], config.embeddingModel);
    if (!result) return;
    await vectorRepo.upsert({
      organizationId: input.organizationId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      domain: input.domain,
      model: result.model,
      content: input.content,
      embedding: result.embedding.slice(0, dimsFor(config, provider)),
      chunkIndex: input.metadata?.chunkIndex as number ?? 0,
      tokens: result.tokens,
    });
  },

  /** Index a knowledge entry (by id) — used by the ingestion / job queue. */
  async indexKnowledgeEntry(entryId: string, organizationId: string): Promise<void> {
    const { rows } = await queryEntry(entryId);
    if (!rows[0]) return;
    const e = rows[0];
    await this.index({
      organizationId,
      sourceType: 'knowledge_entry',
      sourceId: e.id,
      domain: (e.domain as VectorDomain) ?? 'policy',
      content: `${e.title}\n\n${e.content}`,
      metadata: { ...(e.metadata ?? {}), title: e.title },
      replace: true,
    });
  },

  /** Index all published knowledge entries for an org (or the global KB). */
  async indexKnowledgeBase(organizationId: string): Promise<number> {
    const entries = await knowledgeRepo.listEntries({ organizationId, publishedOnly: true });
    let count = 0;
    for (const e of entries) {
      await this.indexKnowledgeEntry(e.id, organizationId);
      count++;
    }
    return count;
  },

  /** Semantic search across indexed content. */
  async search(opts: SearchOptions): Promise<VectorSearchHit[]> {
    const config = await aiConfigRepo.get(opts.organizationId);
    const provider = await this.providerFor(opts.organizationId, config);
    if (!provider.isConfigured()) return [];
    const [embedded] = await provider.embed([opts.query], config.embeddingModel);
    if (!embedded) return [];
    return vectorRepo.search(embedded.embedding.slice(0, dimsFor(config, provider)), {
      organizationId: opts.organizationId,
      domains: opts.domains,
      sourceTypes: opts.sourceTypes,
      minScore: opts.minScore ?? config.ragMinScore,
      limit: opts.limit ?? config.ragTopK,
      includeMetadata: true,
    });
  },

  deleteBySource(sourceType: VectorSourceType, sourceId: string) {
    return vectorRepo.deleteBySource(sourceType, sourceId);
  },

  count(organizationId: string) {
    return vectorRepo.countByOrg(organizationId);
  },
};

async function queryEntry(id: string) {
  return query<any>(`SELECT * FROM knowledge_entries WHERE id = $1`, [id]);
}
