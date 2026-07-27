/**
 * AI provider + model catalogue (server-side reference for the admin UI and
 * capability reporting). Credential key names map to env vars resolved by
 * `resolveCredentials()` in the registry.
 */
export interface ProviderDescriptor {
  kind: string;
  label: string;
  /** Env var key on the credentials object that gates chat availability. */
  credKey: string;
  /** Env var key that gates embedding availability (if different). */
  embeddingCredKey?: string;
  chat: boolean;
  embedding: boolean;
}

export const AI_PROVIDERS: ProviderDescriptor[] = [
  { kind: 'openai', label: 'OpenAI', credKey: 'openaiKey', embeddingCredKey: 'openaiKey', chat: true, embedding: true },
  { kind: 'anthropic', label: 'Anthropic (Claude)', credKey: 'anthropicKey', chat: true, embedding: false },
  { kind: 'gemini', label: 'Google Gemini', credKey: 'geminiKey', chat: true, embedding: false },
  { kind: 'azure', label: 'Azure OpenAI', credKey: 'azureKey', embeddingCredKey: 'azureKey', chat: true, embedding: true },
  { kind: 'ollama', label: 'Ollama (Local)', credKey: 'ollamaBaseUrl', chat: true, embedding: true },
  { kind: 'null', label: 'Disabled', credKey: '', chat: false, embedding: false },
];

export const AI_EMBEDDING_PROVIDERS = ['openai', 'azure', 'ollama', 'null'];

export const AI_MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest', 'claude-sonnet-4', 'claude-opus-4'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'],
  azure: ['complianceos-ai'],
  ollama: ['llama3.1', 'mistral', 'mixtral', 'phi3'],
};

export const AI_EMBEDDING_MODELS: Record<string, string[]> = {
  openai: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  azure: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
  ollama: ['nomic-embed-text', 'all-minilm'],
};
