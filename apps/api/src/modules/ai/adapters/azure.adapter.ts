/**
 * Future AI adapter — Azure AI (Azure OpenAI Service).
 *
 * Implements the provider contract but performs NO network calls. The chat
 * completion request assembly against the Azure deployment endpoint is fully
 * specified for a future implementation. Capabilities are reported as
 * unsupported until enabled.
 */

import type { AiProvider } from '../interfaces.js';
import type { AiCapabilityMap } from '../types.js';
import type { AiProviderKind } from '../types.js';

export interface AzureAiAdapterConfig {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
}

const DEFAULT_API_VERSION = '2024-06-01';

export class AzureAiAdapter implements AiProvider {
  readonly kind: AiProviderKind = 'azure';
  readonly displayName = 'Azure AI';

  private readonly endpoint?: string;
  private readonly apiKey?: string;
  private readonly deployment: string;
  private readonly apiVersion: string;

  constructor(config: AzureAiAdapterConfig = {}) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.deployment = config.deployment ?? 'complianceos-ai';
    this.apiVersion = config.apiVersion ?? DEFAULT_API_VERSION;
  }

  /** Resolve the Azure chat completions URL for the configured deployment. */
  protected buildUrl(): string {
    const base = (this.endpoint ?? '').replace(/\/$/, '');
    return `${base}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;
  }

  /** Build the chat completion request body. */
  protected buildRequest(system: string, user: string): Record<string, unknown> {
    return {
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
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Azure AI adapter not configured: missing endpoint or API key');
    }
    throw new Error('Azure AI adapter is a stub. Network calls are disabled in this build.');
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
