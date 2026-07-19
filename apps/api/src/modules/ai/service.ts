/**
 * AI orchestrator service.
 *
 * Composes the available capabilities of the active provider into a single
 * `ComplaintInsight`. Capabilities a provider does not support are skipped
 * silently (the provider reports them via `capabilities()`), so the service
 * never throws for an unsupported feature — it simply omits the result.
 *
 * No LLM calls are made in this build; the adapters are stubs, so the insight
 * returns the resolved provider information with empty capability results.
 */

import { aiContainer } from './container.js';
import type { AiProvider } from './interfaces.js';
import type {
  AiTextInput,
  ComplaintInsight,
  CategorizationResult,
  PriorityResult,
  SeverityResult,
  SentimentResult,
  RiskScoreResult,
  LanguageResult,
  TranslationResult,
  SummarizationResult,
  DuplicateDetectionResult,
  FrameworkMappingResult,
  RecommendationResult,
  SupportedLanguage,
  AiCapabilityMap,
} from './types.js';

export interface AnalyzeComplaintInput extends AiTextInput {
  existing?: Array<{ id: string; text: string }>;
  category?: string;
  priority?: string;
}

function safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
  // Capability methods are optional; if absent, return undefined.
  return Promise.resolve(fn()).catch(() => undefined);
}

export const aiService = {
  /** Report which capabilities the active provider supports. */
  capabilities(): AiCapabilityMap {
    return aiContainer.getProvider().capabilities();
  },

  /** Resolve the active provider kind (for diagnostics / UI display). */
  activeProvider(): { kind: string; displayName: string } {
    const p = aiContainer.getProvider();
    return { kind: p.kind, displayName: p.displayName };
  },

  /** Produce a full insight for a complaint's narrative text. */
  async analyze(input: AnalyzeComplaintInput): Promise<ComplaintInsight> {
    const provider: AiProvider = aiContainer.getProvider();
    const caps = provider.capabilities();

    const [
      categorization,
      priority,
      severity,
      sentiment,
      risk,
      language,
      summary,
      duplicates,
      frameworks,
      recommendations,
    ] = await Promise.all([
      caps.categorize ? safe(() => (provider as any).categorize(input)) : Promise.resolve(undefined),
      caps.detectPriority ? safe(() => (provider as any).detectPriority(input)) : Promise.resolve(undefined),
      caps.detectSeverity ? safe(() => (provider as any).detectSeverity(input)) : Promise.resolve(undefined),
      caps.analyzeSentiment ? safe(() => (provider as any).analyzeSentiment(input)) : Promise.resolve(undefined),
      caps.scoreRisk ? safe(() => (provider as any).scoreRisk(input)) : Promise.resolve(undefined),
      caps.detectLanguage ? safe(() => (provider as any).detectLanguage(input)) : Promise.resolve(undefined),
      caps.summarize ? safe(() => (provider as any).summarize(input)) : Promise.resolve(undefined),
      caps.detectDuplicates && input.existing?.length
        ? safe(() => (provider as any).detectDuplicates({ ...input, existing: input.existing! }))
        : Promise.resolve(undefined),
      caps.mapFrameworks ? safe(() => (provider as any).mapFrameworks(input)) : Promise.resolve(undefined),
      caps.recommend
        ? safe(() => (provider as any).recommend({ ...input, category: input.category, priority: input.priority }))
        : Promise.resolve(undefined),
    ]);

    return {
      categorization: categorization as CategorizationResult | undefined,
      priority: priority as PriorityResult | undefined,
      severity: severity as SeverityResult | undefined,
      sentiment: sentiment as SentimentResult | undefined,
      risk: risk as RiskScoreResult | undefined,
      language: language as LanguageResult | undefined,
      summary: summary as SummarizationResult | undefined,
      duplicates: duplicates as DuplicateDetectionResult | undefined,
      frameworks: frameworks as FrameworkMappingResult | undefined,
      recommendations: recommendations as RecommendationResult | undefined,
      provider: provider.kind as ComplaintInsight['provider'],
    };
  },

  /** Translate a single string between supported languages. */
  async translate(text: string, source: SupportedLanguage, target: SupportedLanguage): Promise<TranslationResult | undefined> {
    const provider = aiContainer.getProvider();
    if (!provider.capabilities().translate) return undefined;
    return safe(() => (provider as any).translate(text, source, target));
  },
};
