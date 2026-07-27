/**
 * OpenAI chat provider adapter.
 *
 * https://api.openai.com/v1/chat/completions (OpenAI-compatible).
 */
import { OpenAiStyleProvider, type OpenAiStyleConfig } from './openai-style.provider.js';

export interface OpenAiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export class OpenAiProvider extends OpenAiStyleProvider {
  constructor(cfg: OpenAiProviderConfig = {}) {
    const config: OpenAiStyleConfig = {
      kind: 'openai',
      displayName: 'OpenAI',
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl ?? 'https://api.openai.com/v1',
      model: cfg.model ?? 'gpt-4o-mini',
    };
    super(config);
  }
}
