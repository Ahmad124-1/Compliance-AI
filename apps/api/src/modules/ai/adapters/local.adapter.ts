/**
 * Future AI adapter — Local Model (self-hosted / on-prem inference).
 *
 * Implements the provider contract but performs NO network calls. The request
 * assembly targets an OpenAI-compatible local endpoint (e.g. llama.cpp,
 * vLLM, Ollama). Capabilities are reported as unsupported until enabled.
 */

import type { AiProvider } from '../interfaces.js';
import type { AiCapabilityMap } from '../types.js';
import type { AiProviderKind } from '../types.js';

export interface LocalModelAdapterConfig {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

const DEFAULT_BASE_URL = 'http://localhost:11434/v1';

export class LocalModelAdapter implements AiProvider {
  readonly kind: AiProviderKind = 'local';
  readonly displayName = 'Local Model';

  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;

  constructor(config: LocalModelAdapterConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.model = config.model ?? 'local-compliance-model';
    this.apiKey = config.apiKey;
  }

  /** Build the chat completion request body for the local endpoint. */
  protected buildRequest(system: string, user: string): Record<string, unknown> {
    return {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0,
      stream: false,
    };
  }

  /** Wire this to an HTTP client when enabling the adapter. No call today. */
  protected async invoke(_body: Record<string, unknown>): Promise<unknown> {
    throw new Error('Local model adapter is a stub. Network calls are disabled in this build.');
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
