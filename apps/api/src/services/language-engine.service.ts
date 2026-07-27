import type { LanguageCode } from '../types/worker-ai.js';

export interface TranslateInput {
  text: string;
  source: LanguageCode;
  target: LanguageCode;
}

export const languageEngineService = {
  async detect(_text: string): Promise<{ language: LanguageCode; confidence: number }> {
    return { language: 'en', confidence: 0.92 };
  },

  async translate(input: TranslateInput): Promise<{ translated: string; detectedSource?: LanguageCode }> {
    return { translated: `[${input.target}] ${input.text}`, detectedSource: input.source };
  },

  async getSupportedPairs() {
    return [
      { from: 'en', to: 'ur' },
      { from: 'en', to: 'ar' },
      { from: 'en', to: 'hi' },
    ];
  },
};
