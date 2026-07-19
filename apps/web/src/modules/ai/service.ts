import { aiApi } from './api.js';
import type { AnalyzeComplaintInput, TranslationResult } from './types.js';

export const aiService = {
  capabilities: () => aiApi.capabilities(),
  analyze: (input: AnalyzeComplaintInput) => aiApi.analyze(input),
  translate: (text: string, source: string, target: string) =>
    aiApi.translate(text, source, target) as Promise<TranslationResult | null>,
};
