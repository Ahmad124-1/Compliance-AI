/**
 * Embedding providers for semantic search.
 *
 * Produces fixed-dimension vectors used to populate `ai_embeddings` and to
 * embed queries for the vector search engine.
 */
import { withRetry, estimateTokens } from '../retry.js';
import { HttpError } from '../http.js';
import { tokenLedgerRepo } from '../token-ledger.repo.js';
import type { EmbeddingProvider, EmbeddingProviderKind, EmbeddingResult } from '../types.js';

export interface OpenAiEmbeddingConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  dimensions?: number;
  organizationId?: string;
  userId?: string | null;
  jobId?: string | null;
}

const DEFAULT_DIMS = 1536;

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly kind: EmbeddingProviderKind = 'openai';
  readonly displayName: string = 'OpenAI';
  readonly dimensions: number;

  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly orgId: string;
  private readonly userId: string | null;
  private readonly jobId: string | null;

  constructor(cfg: OpenAiEmbeddingConfig = {}) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
    this.model = cfg.model ?? 'text-embedding-3-small';
    this.dimensions = cfg.dimensions ?? DEFAULT_DIMS;
    this.orgId = cfg.organizationId ?? '00000000-0000-0000-0000-000000000000';
    this.userId = cfg.userId ?? null;
    this.jobId = cfg.jobId ?? null;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async embed(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    const m = model ?? this.model;
    const res: any = await withRetry(async () => {
      const r = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey ?? ''}` },
        body: JSON.stringify({ model: m, input: texts }),
      });
      if (!r.ok) {
        let detail: unknown;
        try { detail = await r.json(); } catch { detail = await r.text().catch(() => undefined); }
        throw new HttpError(`HTTP ${r.status}`, r.status, detail);
      }
      return r.json();
    }, { maxAttempts: 3 });

    const data = res?.data ?? [];
    const totalTokens = res?.usage?.total_tokens ?? texts.reduce((s, t) => s + estimateTokens(t), 0);
    await tokenLedgerRepo.recordEmbedding({
      organizationId: this.orgId,
      userId: this.userId,
      jobId: this.jobId,
      provider: this.kind,
      model: m,
      tokens: totalTokens,
    });
    return data.map((d: any) => ({ embedding: d.embedding as number[], model: m, provider: this.kind, tokens: Math.ceil(totalTokens / Math.max(1, texts.length)) }));
  }
}

export class AzureEmbeddingProvider extends OpenAiEmbeddingProvider {
  readonly kind: EmbeddingProviderKind = 'azure';
  readonly displayName: string = 'Azure OpenAI';

  constructor(cfg: OpenAiEmbeddingConfig & { endpoint?: string; deployment?: string; apiVersion?: string } = {}) {
    super({
      apiKey: cfg.apiKey,
      baseUrl: cfg.endpoint ?? 'https://<resource>.openai.azure.com',
      model: cfg.deployment ?? cfg.model ?? 'text-embedding-3-small',
      dimensions: cfg.dimensions,
      organizationId: cfg.organizationId,
      userId: cfg.userId,
      jobId: cfg.jobId,
    });
    // Override the URL construction by pointing apiKey+baseUrl already; Azure uses
    // the same /embeddings path on the resource host when deployed as such.
  }
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly kind: EmbeddingProviderKind = 'ollama';
  readonly displayName = 'Ollama (Local)';
  readonly dimensions: number;

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly orgId: string;

  constructor(cfg: OpenAiEmbeddingConfig = {}) {
    this.baseUrl = (cfg.baseUrl ?? 'http://localhost:11434').replace(/\/$/, '');
    this.model = cfg.model ?? 'nomic-embed-text';
    this.dimensions = cfg.dimensions ?? 768;
    this.orgId = cfg.organizationId ?? '00000000-0000-0000-0000-000000000000';
  }

  isConfigured(): boolean {
    return true;
  }

  async embed(texts: string[], model?: string): Promise<EmbeddingResult[]> {
    const m = model ?? this.model;
    const out: EmbeddingResult[] = [];
    for (const text of texts) {
      const res: any = await withRetry(async () => {
        const r = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: m, prompt: text }),
        });
        if (!r.ok) {
          let detail: unknown;
          try { detail = await r.json(); } catch { detail = await r.text().catch(() => undefined); }
          throw new HttpError(`HTTP ${r.status}`, r.status, detail);
        }
        return r.json();
      }, { maxAttempts: 3 });
      out.push({ embedding: res.embedding as number[], model: m, provider: this.kind, tokens: estimateTokens(text) });
    }
    return out;
  }
}

export class NullEmbeddingProvider implements EmbeddingProvider {
  readonly kind: EmbeddingProviderKind = 'null';
  readonly displayName = 'Disabled';
  readonly dimensions = 1536;

  isConfigured(): boolean {
    return false;
  }

  async embed(): Promise<EmbeddingResult[]> {
    throw new Error('Embedding provider is not configured.');
  }
}
