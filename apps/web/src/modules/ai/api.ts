import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AI_ENDPOINTS } from './constants.js';
import type {
  AiCapabilitiesResponse,
  AnalyzeComplaintInput,
  ComplaintInsight,
  TranslationResult,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const aiApi = {
  capabilities: () => http<AiCapabilitiesResponse>(AI_ENDPOINTS.capabilities),
  analyze: (input: AnalyzeComplaintInput) =>
    http<ComplaintInsight>(AI_ENDPOINTS.analyze, { method: 'POST', body: JSON.stringify(input) }),
  translate: (text: string, source: string, target: string) =>
    http<TranslationResult | null>(AI_ENDPOINTS.translate, {
      method: 'POST',
      body: JSON.stringify({ text, source, target }),
    }),
};
