/**
 * AI Foundation — web domain types (mirror of API contracts).
 */

export type AiProviderKind = 'openai' | 'gemini' | 'azure' | 'local' | 'null';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'pt' | 'ar' | 'hi' | 'zh' | 'bn' | 'id' | 'tr' | 'vi' | 'th';

export type ComplaintCategory =
  | 'wages'
  | 'safety'
  | 'harassment'
  | 'discrimination'
  | 'working_hours'
  | 'forced_labor'
  | 'child_labor'
  | 'freedom_of_association'
  | 'health'
  | 'environment'
  | 'corruption'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface CategorizationResult {
  category: ComplaintCategory;
  confidence: number;
  alternatives: Array<{ category: ComplaintCategory; confidence: number }>;
}

export interface PriorityResult {
  priority: Priority;
  confidence: number;
  signals: string[];
}

export interface SeverityResult {
  severity: Severity;
  confidence: number;
  signals: string[];
}

export interface SentimentResult {
  sentiment: Sentiment;
  score: number;
  signals: string[];
}

export interface RiskScoreResult {
  score: number;
  band: 'low' | 'moderate' | 'high' | 'severe';
  factors: string[];
}

export interface LanguageResult {
  language: SupportedLanguage;
  confidence: number;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface SummarizationResult {
  summary: string;
  conciseSummary: string;
  keyPoints: string[];
}

export interface DuplicateMatch {
  complaintId: string;
  similarity: number;
  reason: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matches: DuplicateMatch[];
}

export interface FrameworkMappingResult {
  frameworks: Array<{ code: string; name: string; clause?: string; relevance: number }>;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  rationale: string;
  priority: Priority;
  confidence: number;
}

export interface RecommendationResult {
  recommendations: Recommendation[];
}

export interface ComplaintInsight {
  categorization?: CategorizationResult;
  priority?: PriorityResult;
  severity?: SeverityResult;
  sentiment?: SentimentResult;
  risk?: RiskScoreResult;
  language?: LanguageResult;
  summary?: SummarizationResult;
  duplicates?: DuplicateDetectionResult;
  frameworks?: FrameworkMappingResult;
  recommendations?: RecommendationResult;
  provider: AiProviderKind;
}

export interface AiCapabilityMap {
  categorize: boolean;
  detectPriority: boolean;
  detectSeverity: boolean;
  analyzeSentiment: boolean;
  scoreRisk: boolean;
  detectLanguage: boolean;
  translate: boolean;
  summarize: boolean;
  detectDuplicates: boolean;
  mapFrameworks: boolean;
  recommend: boolean;
}

export interface AiProviderInfo {
  kind: string;
  displayName: string;
}

export interface AiCapabilitiesResponse {
  provider: AiProviderInfo;
  capabilities: AiCapabilityMap;
}

export interface AnalyzeComplaintInput {
  text: string;
  locale?: SupportedLanguage;
  context?: Record<string, unknown>;
  existing?: Array<{ id: string; text: string }>;
  category?: string;
  priority?: string;
}
