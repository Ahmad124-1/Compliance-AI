/**
 * Google Gemini chat provider adapter.
 *
 * Uses the Generative Language `generateContent` (streaming) endpoint. System
 * instructions are passed via `systemInstruction`. OpenAI-style provider base
 * is not reused because Gemini's wire format differs (contents/parts).
 */
import { withRetry, estimateTokens } from '../retry.js';
import { streamSse, HttpError } from '../http.js';
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

const DEFAULT_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class GeminiProvider implements ChatProvider {
  readonly kind: AiProviderKind = 'gemini';
  readonly displayName = 'Google Gemini';

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(cfg: GeminiProviderConfig = {}) {
    this.apiKey = cfg.apiKey;
    this.model = cfg.model ?? 'gemini-1.5-flash';
    this.baseUrl = (cfg.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private buildUrl(stream: boolean): string {
    const action = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
    return `${this.baseUrl}/models/${this.model}:${action}?key=${this.apiKey ?? ''}`;
  }

  private buildBody(messages: ChatMessage[], options: CompletionOptions, _stream: boolean): Record<string, unknown> {
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const cfg: Record<string, unknown> = {
      temperature: options.temperature ?? 0.2,
      topP: options.topP ?? 1,
      maxOutputTokens: options.maxTokens ?? 2048,
    };
    if (options.jsonMode) (cfg as any).responseMimeType = 'application/json';
    return {
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: cfg,
    };
  }

  private cacheKey(messages: ChatMessage[], opts: CompletionOptions): string {
    const prompt = messages.map((m) => `${m.role}:${m.content}`).join('\n');
    return cacheKeyFor(opts.model ?? this.model, prompt);
  }

  private extractText(data: any): string {
    return (data?.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('');
  }

  async complete(messages: ChatMessage[], options: CompletionOptions): Promise<CompletionResult> {
    const model = options.model ?? this.model;

    if (options.skipCache !== true) {
      const cached = await aiCacheRepo.get(this.cacheKey(messages, options));
      if (cached) {
        await tokenLedgerRepo.recordCompletion({
          organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
          userId: options.userId ?? null,
          jobId: options.jobId ?? null,
          provider: this.kind,
          model,
          promptTokens: estimateTokens(messages.map((m) => m.content).join('\n')),
          completionTokens: estimateTokens(String((cached.response as any)?.text ?? '')),
          cached: true,
          requestId: options.requestId ?? null,
        });
        const c = cached.response as any;
        return {
          text: c.text, model, provider: this.kind,
          usage: c.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          cached: true, requestId: options.requestId, finishReason: c.finishReason, json: c.json,
        };
      }
    }

    const body = this.buildBody(messages, options, false);
    const data: any = await withRetry(async () => {
      const res = await fetch(this.buildUrl(false), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let detail: unknown;
        try { detail = await res.json(); } catch { detail = await res.text().catch(() => undefined); }
        throw new HttpError(`HTTP ${res.status}`, res.status, detail);
      }
      return res.json();
    }, { maxAttempts: 3 });

    const text = this.extractText(data);
    const usage: UsageInfo = {
      promptTokens: data?.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data?.usageMetadata?.totalTokenCount ?? 0,
    };
    const result: CompletionResult = {
      text, model, provider: this.kind, usage, cached: false,
      requestId: options.requestId, json: options.jsonMode ? safeJson(text) : undefined,
    };
    await tokenLedgerRepo.recordCompletion({
      organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
      userId: options.userId ?? null, jobId: options.jobId ?? null,
      provider: this.kind, model, promptTokens: usage.promptTokens, completionTokens: usage.completionTokens,
      cached: false, requestId: options.requestId ?? null,
    });
    if (options.skipCache !== true) {
      await aiCacheRepo.set({
        organizationId: options.organizationId ?? null, cacheKey: this.cacheKey(messages, options),
        provider: this.kind, model, response: result, promptHash: this.cacheKey(messages, options), ttlSeconds: 86400,
      });
    }
    return result;
  }

  async stream(messages: ChatMessage[], options: CompletionOptions, onChunk: StreamHandler): Promise<CompletionResult> {
    const model = options.model ?? this.model;
    const body = this.buildBody(messages, options, true);
    let text = '';
    let usage: UsageInfo = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason: string | undefined;

    await streamSse(
      this.buildUrl(true),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), timeoutMs: 120_000 },
      {
        onEvent: (_evt, data) => {
          try {
            const parsed = JSON.parse(data);
            const piece = this.extractText(parsed);
            if (piece) {
              text += piece;
              onChunk({ delta: piece, done: false });
            }
            const um = parsed?.usageMetadata;
            if (um) {
              usage = {
                promptTokens: um.promptTokenCount ?? usage.promptTokens,
                completionTokens: um.candidatesTokenCount ?? usage.completionTokens,
                totalTokens: um.totalTokenCount ?? usage.totalTokens,
              };
            }
            if (parsed?.candidates?.[0]?.finishReason) finishReason = parsed.candidates[0].finishReason;
          } catch { /* ignore */ }
        },
        onDone: () => onChunk({ delta: '', done: true, finishReason, usage }),
      },
    );

    const result: CompletionResult = {
      text, model, provider: this.kind, usage, cached: false,
      requestId: options.requestId, json: options.jsonMode ? safeJson(text) : undefined,
    };
    await tokenLedgerRepo.recordCompletion({
      organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
      userId: options.userId ?? null, jobId: options.jobId ?? null,
      provider: this.kind, model, promptTokens: usage.promptTokens, completionTokens: usage.completionTokens,
      cached: false, requestId: options.requestId ?? null,
    });
    return result;
  }
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { try { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : undefined; } catch { return undefined; } }
}
