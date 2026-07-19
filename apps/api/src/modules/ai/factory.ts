/**
 * AI provider factory.
 *
 * Resolves the active AI provider from configuration. Adapters are created
 * lazily and credentials are injected from the environment. When AI is
 * disabled or the provider is `null`, the null (no-op) provider is returned.
 */

import { aiConfig } from './config.js';
import type { AiProvider } from './interfaces.js';
import type { AiProviderKind, AiCapabilityMap } from './types.js';
import { NullAiProvider } from './providers/null.provider.js';
import { OpenAiAdapter } from './adapters/openai.adapter.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';
import { AzureAiAdapter } from './adapters/azure.adapter.js';
import { LocalModelAdapter } from './adapters/local.adapter.js';

export interface AiFactoryOptions {
  provider?: AiProviderKind;
  enabled?: boolean;
}

export function createAiProvider(options: AiFactoryOptions = {}): AiProvider {
  const provider = options.provider ?? aiConfig.provider;
  const enabled = options.enabled ?? aiConfig.enabled;

  if (!enabled || provider === 'null') {
    return new NullAiProvider();
  }

  switch (provider as AiProviderKind) {
    case 'openai':
      return new OpenAiAdapter({
        apiKey: process.env.OPENAI_API_KEY,
        model: aiConfig.adapters.openai.model,
        baseUrl: aiConfig.adapters.openai.baseUrl,
      });
    case 'gemini':
      return new GeminiAdapter({
        apiKey: process.env.GEMINI_API_KEY,
        model: aiConfig.adapters.gemini.model,
        baseUrl: aiConfig.adapters.gemini.baseUrl,
      });
    case 'azure':
      return new AzureAiAdapter({
        endpoint: process.env.AZURE_AI_ENDPOINT,
        apiKey: process.env.AZURE_AI_KEY,
        deployment: aiConfig.adapters.azure.deployment,
        apiVersion: aiConfig.adapters.azure.apiVersion,
      });
    case 'local':
      return new LocalModelAdapter({
        baseUrl: aiConfig.adapters.local.baseUrl,
        model: aiConfig.adapters.local.model,
        apiKey: process.env.LOCAL_AI_KEY,
      });
    case 'null':
    default:
      return new NullAiProvider();
  }
}

/** Singleton provider instance resolved from configuration. */
export const defaultAiProvider: AiProvider = createAiProvider();

export function providerCapabilities(provider: AiProvider = defaultAiProvider): AiCapabilityMap {
  return provider.capabilities();
}

