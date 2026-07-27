/**
 * Azure OpenAI chat provider adapter.
 *
 * Targets the Azure deployment endpoint:
 *   {endpoint}/openai/deployments/{deployment}/chat/completions?api-version=...
 */
import { OpenAiStyleProvider, type OpenAiStyleConfig } from './openai-style.provider.js';

export interface AzureProviderConfig {
  endpoint?: string;
  apiKey?: string;
  deployment?: string;
  apiVersion?: string;
  model?: string;
}

export class AzureProvider extends OpenAiStyleProvider {
  constructor(cfg: AzureProviderConfig = {}) {
    const config: OpenAiStyleConfig = {
      kind: 'azure',
      displayName: 'Azure OpenAI',
      apiKey: cfg.apiKey,
      baseUrl: cfg.endpoint ?? 'https://<your-resource>.openai.azure.com',
      deployment: cfg.deployment ?? 'complianceos-ai',
      apiVersion: cfg.apiVersion ?? '2024-06-01',
      model: cfg.model ?? cfg.deployment ?? 'complianceos-ai',
    };
    super(config);
  }
}
