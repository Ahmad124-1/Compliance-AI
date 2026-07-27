/**
 * Anthropic (Claude) chat provider adapter.
 *
 * Uses the Anthropic Messages API with SSE streaming. System prompts are passed
 * via the top-level `system` field rather than a message role.
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

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_SYSTEM = 'You are a compliance assistant for ComplianceOS. Be accurate and cite sources.';

export interface AnthropicProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export class AnthropicProvider implements ChatProvider {
  readonly kind: AiProviderKind = 'anthropic';
  readonly displayName = 'Anthropic';

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(cfg: AnthropicProviderConfig = {}) {
    this.apiKey = cfg.apiKey;
    this.model = cfg.model ?? 'claude-3-5-sonnet-latest';
    this.baseUrl = cfg.baseUrl ?? ANTHROPIC_URL;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey ?? '',
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }

  private splitSystem(messages: ChatMessage[]): { system: string; chat: ChatMessage[] } {
    let system = '';
    const chat: ChatMessage[] = [];
    for (const m of messages) {
      if (m.role === 'system') system += (system ? '\n' : '') + m.content;
      else chat.push(m);
    }
    return { system: system || DEFAULT_SYSTEM, chat };
  }

  private cacheKey(messages: ChatMessage[], opts: CompletionOptions): string {
    const prompt = messages.map((m) => `${m.role}:${m.content}`).join('\n');
    return cacheKeyFor(opts.model ?? this.model, prompt);
  }

  async complete(messages: ChatMessage[], options: CompletionOptions): Promise<CompletionResult> {
    const model = options.model ?? this.model;
    const { system, chat } = this.splitSystem(messages);

    if (options.skipCache !== true) {
      const cached = await aiCacheRepo.get(this.cacheKey(messages, options));
      if (cached) {
        await tokenLedgerRepo.recordCompletion({
          organizationId: options.organizationId ?? '00000000-0000-0000-0000-000000000000',
          userId: options.userId ?? null,
          jobId: options.jobId ?? null,
          provider: this.kind,
          model,
          promptTokens: estimateTokens(system + chat.map((m) => m.content).join('\n')),
          completionTokens: estimateTokens(String((cached.response as any)?.text ?? '')),
          cached: true,
          requestId: options.requestId ?? null,
        });
        const c = cached.response as any;
        return {
          text: c.text,
          model,
          provider: this.kind,
          usage: c.usage ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          cached: true,
          requestId: options.requestId,
          finishReason: c.finishReason,
          json: c.json,
        };
      }
    }

    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
      top_p: options.topP ?? 1,
      system,
      messages: chat.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      stream: false,
    };
    if (options.jsonMode) (body as any).response_format = { type: 'json_object' };

    const data: any = await withRetry(async () => {
      const res = await fetch(this.baseUrl, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
      if (!res.ok) {
        let detail: unknown;
        try { detail = await res.json(); } catch { detail = await res.text().catch(() => undefined); }
        throw new HttpError(`HTTP ${res.status}`, res.status, detail);
      }
      return res.json();
    }, { maxAttempts: 3 });

    const text = data?.content?.map((b: any) => (b.type === 'text' ? b.text : '')).join('') ?? '';
    const usage: UsageInfo = {
      promptTokens: data?.usage?.input_tokens ?? 0,
      completionTokens: data?.usage?.output_tokens ?? 0,
      totalTokens: (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
    };
    const result: CompletionResult = {
      text,
      model,
      provider: this.kind,
      usage,
      cached: false,
      requestId: options.requestId,
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
    const { system, chat } = this.splitSystem(messages);
    const body: Record<string, unknown> = {
      model,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.2,
      top_p: options.topP ?? 1,
      system,
      stream: true,
      messages: chat.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };
    let text = '';
    let usage: UsageInfo = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finishReason: string | undefined;

    await streamSse(
      this.baseUrl,
      { method: 'POST', headers: this.headers(), body: JSON.stringify(body), timeoutMs: 120_000 },
      {
        onEvent: (_evt, data) => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              text += parsed.delta.text;
              onChunk({ delta: parsed.delta.text, done: false });
            } else if (parsed.type === 'message_delta') {
              usage = {
                promptTokens: parsed.usage?.input_tokens ?? usage.promptTokens,
                completionTokens: parsed.usage?.output_tokens ?? usage.completionTokens,
                totalTokens: (parsed.usage?.input_tokens ?? 0) + (parsed.usage?.output_tokens ?? 0),
              };
              if (parsed.delta?.stop_reason) finishReason = parsed.delta.stop_reason;
            } else if (parsed.type === 'message_stop') {
              onChunk({ delta: '', done: true, finishReason, usage });
            }
          } catch { /* ignore malformed chunk */ }
        },
        onDone: () => onChunk({ delta: '', done: true, finishReason, usage }),
      },
    );

    const result: CompletionResult = {
      text,
      model,
      provider: this.kind,
      usage,
      cached: false,
      requestId: options.requestId,
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
