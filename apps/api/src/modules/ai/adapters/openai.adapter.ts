/**
 * Future AI adapter — OpenAI.
 *
 * Implements the provider contract but performs NO network calls. The request
 * assembly (endpoint, headers, body shape) is fully specified so a future
 * implementation only needs to wire `invoke()` to an HTTP client. Until then
 * every capability is reported as unsupported and the orchestrator skips it.
 */

import type { AiProvider } from '../interfaces.js';
import type { AiCapabilityMap } from '../types.js';
import type { AiProviderKind } from '../types.js';

export interface OpenAiAdapterConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

export class OpenAiAdapter implements AiProvider {
  readonly kind: AiProviderKind = 'openai';
  readonly displayName = 'OpenAI';

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: OpenAiAdapterConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
  }

  /** Build the chat completion request body for a capability. */
  protected buildRequest(system: string, user: string): Record<string, unknown> {
    return {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    };
  }

  /** Wire this to an HTTP client when enabling the adapter. No call today. */
  protected async invoke(_body: Record<string, unknown>): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('OpenAI adapter not configured: missing API key');
    }
    throw new Error('OpenAI adapter is a stub. Network calls are disabled in this build.');
  }

  capabilities(): AiCapabilityMap {
    return {
      categorize: false,
      detectPriority: false,
      detectSeverity: false,
      analyzeSentiment: false,
      scoreRisk: false,
      detectLanguage: false,
      translate: false,
      summarize: false,
      detectDuplicates: false,
      mapFrameworks: false,
      recommend: false,
    };
  }
}
