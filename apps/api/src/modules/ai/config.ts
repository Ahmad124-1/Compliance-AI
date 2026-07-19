/**
 * AI Foundation configuration.
 *
 * Centralized, environment-driven configuration. No secrets are read here
 * directly beyond what the platform already loads via `env`; adapters accept
 * their credentials via constructor injection (see factory). This keeps the
 * configuration declarative and provider-agnostic.
 */

import { env } from '../../config/env.js';
import type { AiProviderKind } from './types.js';

export interface AiConfig {
  /** Active provider. Defaults to `null` (no AI inference). */
  provider: AiProviderKind;
  /** Whether the AI insight pipeline is enabled at all. */
  enabled: boolean;
  /** Fallback to the null provider when the active adapter is unavailable. */
  failoverToNull: boolean;
  defaults: {
    targetLanguage: string;
    minDuplicateSimilarity: number;
  };
  adapters: {
    openai: { model: string; baseUrl: string };
    gemini: { model: string; baseUrl: string };
    azure: { deployment: string; apiVersion: string };
    local: { baseUrl: string; model: string };
  };
}

function resolveProvider(): AiProviderKind {
  const raw = (process.env.AI_PROVIDER ?? env['AI_PROVIDER' as keyof typeof env] ?? 'null') as string;
  const allowed: AiProviderKind[] = ['openai', 'gemini', 'azure', 'local', 'null'];
  return (allowed.includes(raw as AiProviderKind) ? raw : 'null') as AiProviderKind;
}

export const aiConfig: AiConfig = {
  provider: resolveProvider(),
  enabled: (process.env.AI_ENABLED ?? 'false') === 'true',
  failoverToNull: true,
  defaults: {
    targetLanguage: process.env.AI_DEFAULT_LANGUAGE ?? 'en',
    minDuplicateSimilarity: Number(process.env.AI_MIN_DUPLICATE_SIMILARITY ?? 0.8),
  },
  adapters: {
    openai: {
      model: process.env.AI_OPENAI_MODEL ?? 'gpt-4o-mini',
      baseUrl: process.env.AI_OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    },
    gemini: {
      model: process.env.AI_GEMINI_MODEL ?? 'gemini-1.5-flash',
      baseUrl:
        process.env.AI_GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta',
    },
    azure: {
      deployment: process.env.AI_AZURE_DEPLOYMENT ?? 'complianceos-ai',
      apiVersion: process.env.AI_AZURE_API_VERSION ?? '2024-06-01',
    },
    local: {
      baseUrl: process.env.AI_LOCAL_BASE_URL ?? 'http://localhost:11434/v1',
      model: process.env.AI_LOCAL_MODEL ?? 'local-compliance-model',
    },
  },
};
