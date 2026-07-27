/**
 * Model pricing table (USD per 1K tokens) used for cost tracking.
 * Values are indicative list prices; override via environment when needed.
 */
import type { AiProviderKind, ModelPricing } from './types.js';

export const CHAT_PRICING: Record<string, ModelPricing> = {
  // OpenAI
  'gpt-4o': { inputPer1k: 0.005, outputPer1k: 0.015 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gpt-4-turbo': { inputPer1k: 0.01, outputPer1k: 0.03 },
  'gpt-3.5-turbo': { inputPer1k: 0.0005, outputPer1k: 0.0015 },
  // Anthropic
  'claude-3-5-sonnet-latest': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-3-5-haiku-latest': { inputPer1k: 0.0008, outputPer1k: 0.004 },
  'claude-3-opus-latest': { inputPer1k: 0.015, outputPer1k: 0.075 },
  'claude-sonnet-4': { inputPer1k: 0.003, outputPer1k: 0.015 },
  'claude-opus-4': { inputPer1k: 0.015, outputPer1k: 0.075 },
  // Google Gemini
  'gemini-1.5-pro': { inputPer1k: 0.00125, outputPer1k: 0.005 },
  'gemini-1.5-flash': { inputPer1k: 0.000075, outputPer1k: 0.0003 },
  'gemini-2.0-flash': { inputPer1k: 0.0001, outputPer1k: 0.0004 },
  // Azure mirrors OpenAI models; prices resolved via the underlying model id.
  // Local / Ollama models are free (self-hosted).
};

export const EMBEDDING_PRICING: Record<string, number> = {
  'text-embedding-3-small': 0.00002,
  'text-embedding-3-large': 0.00013,
  'text-embedding-ada-002': 0.0001,
  'text-embedding-004': 0.0001,
};

export function resolveChatPricing(provider: AiProviderKind, model: string): ModelPricing | null {
  if (provider === 'ollama' || provider === 'null') return null;
  // Azure model ids may be deployment names; fall back to base id heuristic.
  return CHAT_PRICING[model] ?? matchByPrefix(CHAT_PRICING, model) ?? null;
}

export function resolveEmbeddingPrice(model: string): number {
  return EMBEDDING_PRICING[model] ?? matchByPrefix(EMBEDDING_PRICING, model) ?? 0.0001;
}

function matchByPrefix(table: Record<string, unknown>, model: string): unknown {
  for (const key of Object.keys(table)) {
    if (model.startsWith(key) || key.startsWith(model)) return table[key];
  }
  return null;
}
