/**
 * AI provider interfaces.
 *
 * Each capability is expressed as a discrete interface so that adapters can
 * implement only what they support. The orchestrator composes capabilities
 * from whichever provider is active and reports unsupported capabilities via
 * the capability map.
 */

import type {
  AiTextInput,
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

export interface CategorizationProvider {
  categorize(input: AiTextInput): Promise<CategorizationResult>;
}

export interface PriorityProvider {
  detectPriority(input: AiTextInput): Promise<PriorityResult>;
}

export interface SeverityProvider {
  detectSeverity(input: AiTextInput): Promise<SeverityResult>;
}

export interface SentimentProvider {
  analyzeSentiment(input: AiTextInput): Promise<SentimentResult>;
}

export interface RiskScoringProvider {
  scoreRisk(input: AiTextInput): Promise<RiskScoreResult>;
}

export interface LanguageDetectionProvider {
  detectLanguage(input: AiTextInput): Promise<LanguageResult>;
}

export interface TranslationProvider {
  translate(text: string, source: SupportedLanguage, target: SupportedLanguage): Promise<TranslationResult>;
}

export interface SummarizationProvider {
  summarize(input: AiTextInput): Promise<SummarizationResult>;
}

export interface DuplicateDetectionProvider {
  detectDuplicates(input: AiTextInput & { existing: Array<{ id: string; text: string }> }): Promise<DuplicateDetectionResult>;
}

export interface FrameworkMappingProvider {
  mapFrameworks(input: AiTextInput): Promise<FrameworkMappingResult>;
}

export interface RecommendationProvider {
  recommend(input: AiTextInput & { category?: string; priority?: string }): Promise<RecommendationResult>;
}

/**
 * The full AI provider contract. An adapter need not implement every
 * capability; unsupported methods can throw `AiCapabilityUnsupportedError`
 * and the orchestrator will skip them.
 */
export interface AiProvider
  extends Partial<
    CategorizationProvider &
      PriorityProvider &
      SeverityProvider &
      SentimentProvider &
      RiskScoringProvider &
      LanguageDetectionProvider &
      TranslationProvider &
      SummarizationProvider &
      DuplicateDetectionProvider &
      FrameworkMappingProvider &
      RecommendationProvider
  > {
  readonly kind: string;
  readonly displayName: string;
  capabilities(): AiCapabilityMap;
}
