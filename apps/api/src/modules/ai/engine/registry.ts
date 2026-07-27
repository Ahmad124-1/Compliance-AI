/**
 * AI provider registry.
 *
 * Resolves chat + embedding providers from organization AI config and
 * environment variables, and implements ordered automatic fallback across
 * configured providers when a primary provider fails.
 */
import type { AiProviderKind, ChatProvider, EmbeddingProviderKind, EmbeddingProvider } from './types.js';
import { NullChatProvider, AiDisabledError } from './providers/null.provider.js';
import { OpenAiProvider } from './providers/openai.provider.js';
import { AzureProvider } from './providers/azure.provider.js';
import { OllamaProvider } from './providers/ollama.provider.js';
import { AnthropicProvider } from './providers/anthropic.provider.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import {
  OpenAiEmbeddingProvider,
  AzureEmbeddingProvider,
  OllamaEmbeddingProvider,
  NullEmbeddingProvider,
} from './providers/embeddings.js';
import type { AiConfig } from './config.repo.js';

export interface ProviderCredentials {
  openaiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  azureEndpoint?: string;
  azureKey?: string;
  azureDeployment?: string;
  azureApiVersion?: string;
  ollamaBaseUrl?: string;
  organizationId?: string;
  userId?: string | null;
  jobId?: string | null;
}

export function resolveCredentials(): ProviderCredentials {
  return {
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    azureEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    azureKey: process.env.AZURE_OPENAI_KEY,
    azureDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    azureApiVersion: process.env.AZURE_OPENAI_API_VERSION,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
    organizationId: undefined,
  };
}

function buildChat(kind: AiProviderKind, creds: ProviderCredentials, config: AiConfig): ChatProvider {
  switch (kind) {
    case 'openai':
      return new OpenAiProvider({ apiKey: creds.openaiKey, model: config.model });
    case 'anthropic':
      return new AnthropicProvider({ apiKey: creds.anthropicKey, model: config.model });
    case 'gemini':
      return new GeminiProvider({ apiKey: creds.geminiKey, model: config.model });
    case 'azure':
      return new AzureProvider({
        endpoint: creds.azureEndpoint,
        apiKey: creds.azureKey,
        deployment: creds.azureDeployment,
        apiVersion: creds.azureApiVersion,
        model: config.model,
      });
    case 'ollama':
      return new OllamaProvider({ baseUrl: creds.ollamaBaseUrl, model: config.model });
    default:
      return new NullChatProvider();
  }
}

function buildEmbedding(kind: EmbeddingProviderKind, creds: ProviderCredentials, config: AiConfig): EmbeddingProvider {
  const base = {
    organizationId: creds.organizationId,
    userId: creds.userId,
    jobId: creds.jobId,
  };
  switch (kind) {
    case 'openai':
      return new OpenAiEmbeddingProvider({ apiKey: creds.openaiKey, model: config.embeddingModel, dimensions: 1536, ...base });
    case 'azure':
      return new AzureEmbeddingProvider({
        apiKey: creds.azureKey,
        endpoint: creds.azureEndpoint,
        deployment: creds.azureDeployment,
        model: config.embeddingModel,
        dimensions: 1536,
        ...base,
      });
    case 'ollama':
      return new OllamaEmbeddingProvider({ baseUrl: creds.ollamaBaseUrl, model: config.embeddingModel, dimensions: 768, ...base });
    default:
      return new NullEmbeddingProvider();
  }
}

export class ProviderRegistry {
  constructor(
    private readonly config: AiConfig,
    private readonly creds: ProviderCredentials = resolveCredentials(),
  ) {}

  chatProvider(): ChatProvider {
    const p = buildChat(this.config.provider, this.creds, this.config);
    if (this.config.provider === 'null' || !p.isConfigured()) return new NullChatProvider();
    return p;
  }

  embeddingProvider(): EmbeddingProvider {
    const p = buildEmbedding(this.config.embeddingProvider, this.creds, this.config);
    if (this.config.embeddingProvider === 'null' || !p.isConfigured()) return new NullEmbeddingProvider();
    return p;
  }

  /**
   * Run a completion with automatic fallback across the configured fallback
   * order. Throws `AiDisabledError` if no provider can serve the request.
   */
  async withFallback<T>(run: (provider: ChatProvider) => Promise<T>, forceProvider?: AiProviderKind): Promise<T> {
    const order: AiProviderKind[] = forceProvider
      ? [forceProvider]
      : [this.config.provider, ...(this.config.fallbackOrder as AiProviderKind[])];
    const tried = new Set<AiProviderKind>();
    let lastErr: unknown;
    for (const kind of order) {
      if (kind === 'null' || tried.has(kind)) continue;
      tried.add(kind);
      const provider = buildChat(kind, this.creds, this.config);
      if (!provider.isConfigured()) continue;
      try {
        return await run(provider);
      } catch (err) {
        lastErr = err;
        if (err instanceof AiDisabledError) continue;
        // Retryable/transient errors fall through to the next provider.
      }
    }
    throw lastErr ?? new AiDisabledError();
  }
}

export function createRegistry(config: AiConfig, creds?: ProviderCredentials): ProviderRegistry {
  return new ProviderRegistry(config, creds ?? resolveCredentials());
}
