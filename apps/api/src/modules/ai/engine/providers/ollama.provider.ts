/**
 * Ollama / local model chat provider adapter.
 *
 * Targets the OpenAI-compatible `/v1/chat/completions` exposed by Ollama
 * (and other local servers such as llama.cpp, vLLM). No API key required.
 */
import { OpenAiStyleProvider, type OpenAiStyleConfig } from './openai-style.provider.js';

export interface OllamaProviderConfig {
  baseUrl?: string;
  model?: string;
}

export class OllamaProvider extends OpenAiStyleProvider {
  constructor(cfg: OllamaProviderConfig = {}) {
    const config: OpenAiStyleConfig = {
      kind: 'ollama',
      displayName: 'Ollama (Local)',
      apiKey: undefined,
      baseUrl: cfg.baseUrl ?? 'http://localhost:11434/v1',
      model: cfg.model ?? 'llama3.1',
    };
    super(config);
  }

  isConfigured(): boolean {
    // Local models are always considered available; health is verified at call time.
    return true;
  }
}
