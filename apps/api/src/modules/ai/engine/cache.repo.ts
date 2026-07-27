/**
 * AI response cache (database-backed).
 *
 * Keyed by a hash of (model + normalized prompt) so semantically identical
 * requests are served without calling the provider. Supports TTL expiry and
 * is disabled per-request via `skipCache`.
 */
import { query } from '../../../db/pool.js';
import { createHash } from 'node:crypto';

export function cacheKeyFor(model: string, prompt: string): string {
  return createHash('sha256').update(`${model}::${prompt}`).digest('hex');
}

export interface CachedResponse {
  id: string;
  cacheKey: string;
  provider: string;
  model: string;
  response: unknown;
  promptHash: string;
  expiresAt: Date;
  createdAt: Date;
}

function mapRow(r: any): CachedResponse {
  return {
    id: r.id,
    cacheKey: r.cache_key,
    provider: r.provider,
    model: r.model,
    response: r.response,
    promptHash: r.prompt_hash,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

export const aiCacheRepo = {
  async get(key: string): Promise<CachedResponse | null> {
    const { rows } = await query<any>(
      `SELECT * FROM ai_cache WHERE cache_key = $1 AND expires_at > now()`,
      [key],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async set(input: {
    organizationId: string | null;
    cacheKey: string;
    provider: string;
    model: string;
    response: unknown;
    promptHash: string;
    ttlSeconds: number;
  }): Promise<void> {
    await query(
      `INSERT INTO ai_cache (organization_id, cache_key, provider, model, response, prompt_hash, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6, now() + ($7 || ' seconds')::interval)
       ON CONFLICT (cache_key) DO UPDATE SET
         response = EXCLUDED.response,
         provider = EXCLUDED.provider,
         model = EXCLUDED.model,
         prompt_hash = EXCLUDED.prompt_hash,
         expires_at = now() + ($7 || ' seconds')::interval,
         created_at = now()`,
      [
        input.organizationId,
        input.cacheKey,
        input.provider,
        input.model,
        JSON.stringify(input.response),
        input.promptHash,
        String(input.ttlSeconds),
      ],
    );
  },

  async purgeExpired(): Promise<number> {
    const { rowCount } = await query(`DELETE FROM ai_cache WHERE expires_at <= now()`);
    return rowCount ?? 0;
  },

  async purgeOrg(organizationId: string): Promise<number> {
    const { rowCount } = await query(`DELETE FROM ai_cache WHERE organization_id = $1`, [organizationId]);
    return rowCount ?? 0;
  },
};
