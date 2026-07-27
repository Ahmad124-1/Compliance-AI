/**
 * Shared provider utilities + a JSON-response normalizer.
 *
 * All chat providers share the same message shape and a very similar
 * OpenAI-compatible streaming protocol. This base reduces duplication for the
 * OpenAI / Azure / Ollama adapters while Anthropic uses its own transport.
 */
import { withRetry, estimateTokens } from '../retry.js';
import { HttpError, streamSse } from '../http.js';
import { globalRateLimiter } from '../rate-limiter.js';
import { aiCacheRepo, cacheKeyFor } from '../cache.repo.js';
import { tokenLedgerRepo } from '../token-ledger.repo.js';
import type {
  AiProviderKind,
  ChatMessage,
  ChatProvider,
  CompletionOptions,
  CompletionResult,
  StreamHandler,
  UsageInfo,
} from '../types.js';

export interface OpenAiStyleConfig {
  apiKey?: string;
  baseUrl: string;
  model?: string;
  /** Azure-specific deployment name (when set, chat path uses deployments). */
  deployment?: string;
  /** Azure-specific api-version. */
  apiVersion?: string;
  /** Extra headers (e.g. Anthropic passthrough / custom). */
  extraHeaders?: Record<string, string>;
  /** Provider kind reported by this adapter. */
  kind: AiProviderKind;
  displayName: string;
  /** Build request body (allows Anthropic-style subclasses to override). */
  buildBody?: (messages: ChatMessage[], opts: CompletionOptions, stream: boolean) => Record<string, unknown>;
  /** Parse a non-streaming response into text + usage. */
  parseCompletion?: (data: any) => { text: string; usage: UsageInfo; finishReason?: string };
  /** Parse a streaming delta chunk into partial text. */
  parseStreamDelta?: (data: any) => { delta: string; finishReason?: string };
}

const DEFAULT_SYSTEM = 'You are a compliance assistant for the ComplianceOS platform. Be accurate, cite sources, and never fabricate.';

export class OpenAiStyleProvider implements ChatProvider {
  readonly kind: AiProviderKind;
  readonly displayName: string;
  protected readonly apiKey?: string;
  protected readonly baseUrl: string;
  protected readonly model: string;
  protected readonly deployment?: string;
  protected readonly apiVersion?: string;
  protected readonly extraHeaders: Record<string, string>;
  protected readonly buildBodyFn: NonNullable<OpenAiStyleConfig['buildBody']>;
  protected readonly parseCompletionFn: NonNullable<OpenAiStyleConfig['parseCompletion']>;
  protected readonly parseStreamDeltaFn: NonNullable<OpenAiStyleConfig['parseStreamDelta']>;

  constructor(cfg: OpenAiStyleConfig) {
    this.kind = cfg.kind;
    this.displayName = cfg.displayName;
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl.replace(/\/$/, '');
    this.model = cfg.model ?? 'gpt-4o-mini';
    this.deployment = cfg.deployment;
    this.apiVersion = cfg.apiVersion;
    this.extraHeaders = cfg.extraHeaders ?? {};
    this.buildBodyFn = cfg.buildBody ?? defaultBuildBody;
    this.parseCompletionFn = cfg.parseCompletion ?? defaultParseCompletion;
    this.parseStreamDeltaFn = cfg.parseStreamDelta ?? defaultParseStreamDelta;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey) || this.kind === 'ollama';
  }

  private chatUrl(): string {
    if (this.deployment) {
      return `${this.baseUrl}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion ?? '2024-06-01'}`;
    }
    return `${this.baseUrl}/chat/completions`;
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...this.extraHeaders };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  private cacheKey(messages: ChatMessage[], opts: CompletionOptions): string {
    const prompt = messages.map((m) => `${m.role}:${m.content}`).join('\n');
    return cacheKeyFor(opts.model ?? this.model, prompt);
  }

  async complete(messages: ChatMessage[], options: CompletionOptions): Promise<CompletionResult> {
    const model = options.model ?? this.model;
    const promptText = messages.map((m) => `${m.role}:${m.content}`).join('\n');

    if (options.skipCache !== true) {
      const cached = await aiCacheRepo.get(this.cacheKey(messages, options));
      if (cached) {
        await tokenLedgerRepo.recordCompletion({
          organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
          userId: options.userId ?? null,
          jobId: options.jobId ?? null,
          provider: this.kind,
          model,
          promptTokens: estimateTokens(promptText),
          completionTokens: estimateTokens(String((cached.response as any)?.text ?? '')),
          cached: true,
          requestId: options.requestId ?? null,
        });
        const c = cached.response as any;
        return {
          text: c.text,
          model: c.model ?? model,
          provider: this.kind,
          usage: c.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          cached: true,
          requestId: options.requestId,
          finishReason: c.finishReason,
          json: c.json,
        };
      }
    }

    const body = this.buildBodyFn(withSystem(messages, options), { ...options, model }, false);
    const data = await withRetry(async () => this.postJson(this.chatUrl(), body), { maxAttempts: 3 });
    const parsed = this.parseCompletionFn(data);
    const result: CompletionResult = {
      text: parsed.text,
      model,
      provider: this.kind,
      usage: parsed.usage,
      cached: false,
      requestId: options.requestId,
      finishReason: parsed.finishReason,
      json: options.jsonMode ? safeJson(parsed.text) : undefined,
    };
    await tokenLedgerRepo.recordCompletion({
      organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
      userId: options.userId ?? null,
      jobId: options.jobId ?? null,
      provider: this.kind,
      model,
      promptTokens: parsed.usage.promptTokens,
      completionTokens: parsed.usage.completionTokens,
      cached: false,
      requestId: options.requestId ?? null,
    });
    if (options.skipCache !== true) {
      await aiCacheRepo.set({
        organizationId: options.organizationId ?? null,
        cacheKey: this.cacheKey(messages, options),
        provider: this.kind,
        model,
        response: result,
        promptHash: this.cacheKey(messages, options),
        ttlSeconds: 86400,
      });
    }
    return result;
  }

  async stream(messages: ChatMessage[], options: CompletionOptions, onChunk: StreamHandler): Promise<CompletionResult> {
    const model = options.model ?? this.model;
    const body = this.buildBodyFn(withSystem(messages, options), { ...options, model }, true);
    let text = '';
    let usage: UsageInfo = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason: string | undefined;

    await streamSse(
      this.chatUrl(),
      { method: 'POST', headers: this.headers(), body: JSON.stringify(body), timeoutMs: 120_000 },
      {
        onEvent: (_evt, data) => {
          try {
            const parsed = JSON.parse(data);
            const d = this.parseStreamDeltaFn(parsed);
            if (d.delta) {
              text += d.delta;
              onChunk({ delta: d.delta, done: false, finishReason: d.finishReason });
            }
            const u = parsed.usage;
            if (u) {
              usage = {
                promptTokens: u.prompt_tokens ?? u.promptTokens ?? 0,
                completionTokens: u.completion_tokens ?? u.completionTokens ?? 0,
                totalTokens: u.total_tokens ?? u.totalTokens ?? 0,
              };
            }
            if (d.finishReason) finishReason = d.finishReason;
          } catch { /* ignore malformed chunk */ }
        },
        onDone: () => {
          onChunk({ delta: '', done: true, finishReason, usage });
        },
      },
    );

    const result: CompletionResult = {
      text,
      model,
      provider: this.kind,
      usage,
      cached: false,
      requestId: options.requestId,
      finishReason,
      json: options.jsonMode ? safeJson(text) : undefined,
    };
    await tokenLedgerRepo.recordCompletion({
      organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
      userId: options.userId ?? null,
      jobId: options.jobId ?? null,
      provider: this.kind,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      cached: false,
      requestId: options.requestId ?? null,
    });
    return result;
  }

  protected async postJson(url: string, body: unknown): Promise<any> {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let detail: unknown;
      try { detail = await res.json(); } catch { detail = await res.text().catch(() => undefined); }
      throw new HttpError(`HTTP ${res.status}`, res.status, detail);
    }
    return res.json();
  }

  /** Hook used by subclasses to apply rate-limit checks before calling provider (optional). */
  protected checkRateLimit(organizationId: string, rpm: number, tpm: number, tokens: number): void {
    const verdict = globalRateLimiter.allow(`ai:${organizationId}`, rpm, tpm, tokens);
    if (!verdict.allowed) {
      throw new HttpError(`Rate limit exceeded. Retry after ${Math.ceil(verdict.retryAfterMs / 1000)}s`, 429);
    }
  }
}

function defaultBuildBody(messages: ChatMessage[], opts: CompletionOptions, stream: boolean): Record<string, unknown> {
  const b: Record<string, unknown> = {
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 2048,
    top_p: opts.topP ?? 1,
    stream,
  };
  if (opts.jsonMode) (b as any).response_format = { type: 'json_object' };
  if (opts.stop) (b as any).stop = opts.stop;
  return b;
}

function defaultParseCompletion(data: any): { text: string; usage: UsageInfo; finishReason?: string } {
  const choice = data?.choices?.[0];
  return {
    text: choice?.message?.content ?? '',
    finishReason: choice?.finish_reason,
    usage: {
      promptTokens: data?.usage?.prompt_tokens ?? 0,
      completionTokens: data?.usage?.completion_tokens ?? 0,
      totalTokens: data?.usage?.total_tokens ?? 0,
    },
  };
}

function defaultParseStreamDelta(data: any): { delta: string; finishReason?: string } {
  const choice = data?.choices?.[0];
  return { delta: choice?.delta?.content ?? '', finishReason: choice?.finish_reason };
}

function withSystem(messages: ChatMessage[], _opts: CompletionOptions): ChatMessage[] {
  if (messages.some((m) => m.role === 'system')) return messages;
  return [{ role: 'system', content: DEFAULT_SYSTEM }, ...messages];
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : undefined;
    } catch {
      return undefined;
    }
  }
}
