import { ragService } from '../modules/ai/rag/pipeline.js';
import type { LanguageCode } from '../types/worker-ai.js';

export interface SummarizeInput {
  content: string;
  language: LanguageCode;
  maxWords?: number;
}

export interface ExplainInput {
  content: string;
  language: LanguageCode;
}

export interface AnswerQuestionInput {
  organizationId: string;
  documentId: string;
  query: string;
  language: LanguageCode;
}

export const documentAssistantService = {
  async summarize(input: SummarizeInput): Promise<{ summary: string; keyPoints: string[] }> {
    const summary = input.content.length > (input.maxWords || 200) * 5 ? input.content.slice(0, (input.maxWords || 200) * 5) : input.content;
    return { summary: `[Summary] ${summary}`, keyPoints: ['Key point 1', 'Key point 2'] };
  },

  async explain(input: ExplainInput): Promise<{ explanation: string; sections: Array<{ title: string; body: string }> }> {
    return { explanation: input.content, sections: [{ title: 'Section 1', body: input.content }] };
  },

  async answerQuestion(input: AnswerQuestionInput): Promise<{ answer: string; citations: Array<{ text: string; score: number }> }> {
    const result = await ragService.run({
      organizationId: input.organizationId,
      query: input.query,
      retrieveOnly: true,
    });
    return {
      answer: result.answer || 'No answer found.',
      citations: result.context.vectorHits.map((h) => ({ text: h.content, score: h.score })),
    };
  },

  async highlightImportant(input: { content: string; language: LanguageCode }): Promise<Array<{ text: string; reason: string }>> {
    return [{ text: input.content.slice(0, 200), reason: 'Critical policy clause' }];
  },
};
