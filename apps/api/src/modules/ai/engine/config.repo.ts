/**
 * AI configuration service (DB-backed, per organization).
 *
 * Owns the `ai_config` row for each organization and exposes defaults when a
 * row does not yet exist. Admin UI mutates these settings; the engine reads
 * them on every request to select provider, model, temperature, limits, RAG
 * behavior and which retrieval domains are enabled.
 */
import { query } from '../../../db/pool.js';
import type { AiProviderKind, EmbeddingProviderKind } from './types.js';

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
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_AI_CONFIG: Omit<AiConfig, 'organizationId' | 'createdAt' | 'updatedAt'> = {
  provider: 'null',
  embeddingProvider: 'null',
  model: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  temperature: 0.2,
  maxTokens: 2048,
  topP: 1,
  fallbackEnabled: true,
  fallbackOrder: ['openai', 'anthropic', 'gemini', 'azure', 'ollama'],
  rateLimitRpm: 60,
  rateLimitTpm: 90000,
  cacheEnabled: true,
  cacheTtlSeconds: 86400,
  streamingEnabled: true,
  ragTopK: 6,
  ragMinScore: 0.2,
  systemPrompt: null,
  enableAudit: true,
  enableSupplier: true,
  enableCapa: true,
  enableGrievance: true,
  enableEvidence: true,
  enablePolicy: true,
};

function mapRow(r: any): AiConfig {
  return {
    organizationId: r.organization_id,
    provider: r.provider,
    embeddingProvider: r.embedding_provider,
    model: r.model,
    embeddingModel: r.embedding_model,
    temperature: Number(r.temperature),
    maxTokens: Number(r.max_tokens),
    topP: Number(r.top_p),
    fallbackEnabled: r.fallback_enabled,
    fallbackOrder: Array.isArray(r.fallback_order) ? r.fallback_order : [],
    rateLimitRpm: Number(r.rate_limit_rpm),
    rateLimitTpm: Number(r.rate_limit_tpm),
    cacheEnabled: r.cache_enabled,
    cacheTtlSeconds: Number(r.cache_ttl_seconds),
    streamingEnabled: r.streaming_enabled,
    ragTopK: Number(r.rag_top_k),
    ragMinScore: Number(r.rag_min_score),
    systemPrompt: r.system_prompt,
    enableAudit: r.enable_audit,
    enableSupplier: r.enable_supplier,
    enableCapa: r.enable_capa,
    enableGrievance: r.enable_grievance,
    enableEvidence: r.enable_evidence,
    enablePolicy: r.enable_policy,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const aiConfigRepo = {
  async get(organizationId: string): Promise<AiConfig> {
    const { rows } = await query<any>(`SELECT * FROM ai_config WHERE organization_id = $1`, [organizationId]);
    if (rows[0]) return mapRow(rows[0]);
    // Materialize a default row so subsequent updates are simple.
    const { rows: inserted } = await query<any>(
      `INSERT INTO ai_config (organization_id) VALUES ($1)
       ON CONFLICT (organization_id) DO UPDATE SET organization_id = EXCLUDED.organization_id
       RETURNING *`,
      [organizationId],
    );
    return mapRow(inserted[0]);
  },

  async update(organizationId: string, patch: Partial<Omit<AiConfig, 'organizationId' | 'createdAt' | 'updatedAt'>>): Promise<AiConfig> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.provider !== undefined) set('provider', patch.provider);
    if (patch.embeddingProvider !== undefined) set('embedding_provider', patch.embeddingProvider);
    if (patch.model !== undefined) set('model', patch.model);
    if (patch.embeddingModel !== undefined) set('embedding_model', patch.embeddingModel);
    if (patch.temperature !== undefined) set('temperature', patch.temperature);
    if (patch.maxTokens !== undefined) set('max_tokens', patch.maxTokens);
    if (patch.topP !== undefined) set('top_p', patch.topP);
    if (patch.fallbackEnabled !== undefined) set('fallback_enabled', patch.fallbackEnabled);
    if (patch.fallbackOrder !== undefined) set('fallback_order', JSON.stringify(patch.fallbackOrder));
    if (patch.rateLimitRpm !== undefined) set('rate_limit_rpm', patch.rateLimitRpm);
    if (patch.rateLimitTpm !== undefined) set('rate_limit_tpm', patch.rateLimitTpm);
    if (patch.cacheEnabled !== undefined) set('cache_enabled', patch.cacheEnabled);
    if (patch.cacheTtlSeconds !== undefined) set('cache_ttl_seconds', patch.cacheTtlSeconds);
    if (patch.streamingEnabled !== undefined) set('streaming_enabled', patch.streamingEnabled);
    if (patch.ragTopK !== undefined) set('rag_top_k', patch.ragTopK);
    if (patch.ragMinScore !== undefined) set('rag_min_score', patch.ragMinScore);
    if (patch.systemPrompt !== undefined) set('system_prompt', patch.systemPrompt);
    if (patch.enableAudit !== undefined) set('enable_audit', patch.enableAudit);
    if (patch.enableSupplier !== undefined) set('enable_supplier', patch.enableSupplier);
    if (patch.enableCapa !== undefined) set('enable_capa', patch.enableCapa);
    if (patch.enableGrievance !== undefined) set('enable_grievance', patch.enableGrievance);
    if (patch.enableEvidence !== undefined) set('enable_evidence', patch.enableEvidence);
    if (patch.enablePolicy !== undefined) set('enable_policy', patch.enablePolicy);
    if (!sets.length) return this.get(organizationId);
    sets.push(`updated_at = now()`);
    params.push(organizationId);
    const { rows } = await query<any>(
      `INSERT INTO ai_config (organization_id) VALUES ($1)
       ON CONFLICT (organization_id) DO NOTHING;
       UPDATE ai_config SET ${sets.join(', ')} WHERE organization_id = $${i} RETURNING *`,
      [organizationId, ...params],
    );
    return mapRow(rows[0]);
  },
};
