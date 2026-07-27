/**
 * Token accounting + cost tracking ledger repository.
 *
 * Every completion and embedding request records its token usage and computed
 * USD cost here, enabling per-organization spend dashboards and quotas.
 */
import { query } from '../../../db/pool.js';
import type { AiProviderKind, EmbeddingProviderKind } from './types.js';
import { resolveChatPricing, resolveEmbeddingPrice } from './pricing.js';

export interface TokenLedgerRow {
  id: string;
  organizationId: string;
  userId: string | null;
  jobId: string | null;
  provider: string;
  model: string;
  kind: 'completion' | 'embedding';
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  cached: boolean;
  requestId: string | null;
  createdAt: Date;
}

function mapRow(r: any): TokenLedgerRow {
  return {
    id: r.id,
    organizationId: r.organization_id,
    userId: r.user_id,
    jobId: r.job_id,
    provider: r.provider,
    model: r.model,
    kind: r.kind,
    promptTokens: Number(r.prompt_tokens),
    completionTokens: Number(r.completion_tokens),
    totalTokens: Number(r.total_tokens),
    costUsd: Number(r.cost_usd),
    cached: r.cached,
    requestId: r.request_id,
    createdAt: r.created_at,
  };
}

function computeCompletionCost(provider: AiProviderKind, model: string, promptTokens: number, completionTokens: number): number {
  const p = resolveChatPricing(provider, model);
  if (!p) return 0;
  return (promptTokens / 1000) * p.inputPer1k + (completionTokens / 1000) * p.outputPer1k;
}

function computeEmbeddingCost(provider: EmbeddingProviderKind, model: string, tokens: number): number {
  const per1k = resolveEmbeddingPrice(model);
  if (provider === 'ollama') return 0;
  return (tokens / 1000) * per1k;
}

export const tokenLedgerRepo = {
  async recordCompletion(input: {
    organizationId: string;
    userId?: string | null;
    jobId?: string | null;
    provider: AiProviderKind;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cached?: boolean;
    requestId?: string | null;
  }): Promise<TokenLedgerRow> {
    const cost = computeCompletionCost(input.provider, input.model, input.promptTokens, input.completionTokens);
    const { rows } = await query<TokenLedgerRow>(
      `INSERT INTO ai_token_ledger
        (organization_id, user_id, job_id, provider, model, kind, prompt_tokens, completion_tokens, total_tokens, cost_usd, cached, request_id)
       VALUES ($1,$2,$3,$4,$5,'completion',$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        input.organizationId,
        input.userId ?? null,
        input.jobId ?? null,
        input.provider,
        input.model,
        input.promptTokens,
        input.completionTokens,
        input.promptTokens + input.completionTokens,
        cost,
        input.cached ?? false,
        input.requestId ?? null,
      ],
    );
    return mapRow(rows[0]);
  },

  async recordEmbedding(input: {
    organizationId: string;
    userId?: string | null;
    jobId?: string | null;
    provider: EmbeddingProviderKind;
    model: string;
    tokens: number;
    requestId?: string | null;
  }): Promise<TokenLedgerRow> {
    const cost = computeEmbeddingCost(input.provider, input.model, input.tokens);
    const { rows } = await query<TokenLedgerRow>(
      `INSERT INTO ai_token_ledger
        (organization_id, user_id, job_id, provider, model, kind, prompt_tokens, completion_tokens, total_tokens, cost_usd, cached, request_id)
       VALUES ($1,$2,$3,$4,$5,'embedding',$6,0,$6,$7,false,$8) RETURNING *`,
      [
        input.organizationId,
        input.userId ?? null,
        input.jobId ?? null,
        input.provider,
        input.model,
        input.tokens,
        cost,
        input.requestId ?? null,
      ],
    );
    return mapRow(rows[0]);
  },

  /** Spend summary per organization (optionally bounded by a date window). */
  async summary(organizationId: string, sinceDays = 30): Promise<{
    totalCostUsd: number;
    totalTokens: number;
    completionTokens: number;
    embeddingTokens: number;
    requestCount: number;
    byProvider: Record<string, { costUsd: number; tokens: number }>;
  }> {
    const { rows } = await query<any>(
      `SELECT provider, kind,
              SUM(total_tokens) AS total_tokens,
              SUM(cost_usd) AS cost_usd,
              COUNT(*) AS requests
       FROM ai_token_ledger
       WHERE organization_id = $1 AND created_at >= now() - ($2 || ' days')::interval
       GROUP BY provider, kind`,
      [organizationId, String(sinceDays)],
    );
    const byProvider: Record<string, { costUsd: number; tokens: number }> = {};
    let totalCostUsd = 0;
    let totalTokens = 0;
    let completionTokens = 0;
    let embeddingTokens = 0;
    let requestCount = 0;
    for (const r of rows) {
      const cost = Number(r.cost_usd);
      const tokens = Number(r.total_tokens);
      totalCostUsd += cost;
      totalTokens += tokens;
      requestCount += Number(r.requests);
      if (r.kind === 'completion') completionTokens += tokens;
      else embeddingTokens += tokens;
      if (!byProvider[r.provider]) byProvider[r.provider] = { costUsd: 0, tokens: 0 };
      byProvider[r.provider].costUsd += cost;
      byProvider[r.provider].tokens += tokens;
    }
    return { totalCostUsd, totalTokens, completionTokens, embeddingTokens, requestCount, byProvider };
  },

  async recent(organizationId: string, limit = 50): Promise<TokenLedgerRow[]> {
    const { rows } = await query<any>(
      `SELECT * FROM ai_token_ledger WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [organizationId, limit],
    );
    return rows.map(mapRow);
  },
};
