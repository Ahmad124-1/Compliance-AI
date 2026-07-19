/**
 * Future AI adapter — Google Gemini.
 *
 * Implements the provider contract but performs NO network calls. The
 * generate-content request assembly is fully specified for a future
 * implementation. Capabilities are reported as unsupported until enabled.
 */

import type { AiProvider } from '../interfaces.js';
import type { AiCapabilityMap } from '../types.js';
import type { AiProviderKind } from '../types.js';

export interface GeminiAdapterConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

const DEFAULT_MODEL = 'gemini-1.5-flash';

export class GeminiAdapter implements AiProvider {
  readonly kind: AiProviderKind = 'gemini';
  readonly displayName = 'Google Gemini';

  private readonly apiKey?: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: GeminiAdapterConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? DEFAULT_MODEL;
    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
  }

  /** Build the generateContent request body. */
  protected buildRequest(system: string, prompt: string): Record<string, unknown> {
    return {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    };
  }

  /** Wire this to an HTTP client when enabling the adapter. No call today. */
  protected async invoke(_body: Record<string, unknown>): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('Gemini adapter not configured: missing API key');
    }
    throw new Error('Gemini adapter is a stub. Network calls are disabled in this build.');
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
