import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { WORKER_AI_ENDPOINTS } from './constants.js';
import type {
  WorkerAiConversation,
  WorkerAiMessage,
  WorkerAiDocument,
  WorkerAiTrainingSession,
  WorkerAiEmergencyContact,
  WorkerAiRightsTopic,
  WorkerAiSearchHit,
  WorkerAiUsage,
  LanguageCode,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export interface ChatInput {
  conversationId: string;
  message: string;
  language?: LanguageCode;
  useRag?: boolean;
}

export interface VoiceTranscribeInput {
  audio: string;
  language?: LanguageCode;
}

export interface VoiceSynthesizeInput {
  text: string;
  language?: LanguageCode;
  voice?: string;
}

export interface TrainingQuizInput {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
}

export interface TranslateInput {
  text: string;
  source?: LanguageCode;
  target: LanguageCode;
}

export const workerAiApi = {
  chat: (input: ChatInput) =>
    http<{ conversation: WorkerAiConversation; message: WorkerAiMessage }>(WORKER_AI_ENDPOINTS.chat, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  history: (conversationId: string, limit = 50) => {
    const params = new URLSearchParams({ conversationId, limit: String(limit) });
    return http<WorkerAiMessage[]>(`${WORKER_AI_ENDPOINTS.history}?${params.toString()}`);
  },

  conversations: () => http<WorkerAiConversation[]>(WORKER_AI_ENDPOINTS.conversations),

  documents: () => http<WorkerAiDocument[]>(WORKER_AI_ENDPOINTS.documents),

  uploadDocument: async (file: File, language?: LanguageCode): Promise<WorkerAiDocument> => {
    const form = new FormData();
    form.append('file', file);
    if (language) form.append('language', language);
    const token = tokenStorage.getAccessToken();
    const res = await fetch(WORKER_AI_ENDPOINTS.documentUpload, {
      method: 'POST',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      body: form,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  voiceTranscribe: (input: VoiceTranscribeInput) =>
    http<{ text: string; language: LanguageCode; confidence: number }>(WORKER_AI_ENDPOINTS.voiceTranscribe, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  voiceSynthesize: (input: VoiceSynthesizeInput) =>
    http<{ audioUrl: string; durationMs: number }>(WORKER_AI_ENDPOINTS.voiceSynthesize, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  trainingQuiz: (input: TrainingQuizInput) =>
    http<WorkerAiTrainingSession>(WORKER_AI_ENDPOINTS.trainingQuiz, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  trainingRecommendations: () => http<Array<{ id: string; title: string; type: string; progress: number }>>(WORKER_AI_ENDPOINTS.trainingRecommendations),

  trainingProgress: () =>
    http<{ completed: number; total: number; overallProgress: number }>(WORKER_AI_ENDPOINTS.trainingProgress),

  knowledgeSearch: (query: string, opts?: { category?: string; language?: LanguageCode }) => {
    const params = new URLSearchParams({ query, ...(opts?.category ? { category: opts.category } : {}), ...(opts?.language ? { language: opts.language } : {}) });
    return http<WorkerAiSearchHit[]>(`${WORKER_AI_ENDPOINTS.knowledgeSearch}?${params.toString()}`);
  },

  rightsTopics: (language?: LanguageCode) => {
    const params = language ? new URLSearchParams({ language }) : undefined;
    const url = params ? `${WORKER_AI_ENDPOINTS.rightsTopics}?${params.toString()}` : WORKER_AI_ENDPOINTS.rightsTopics;
    return http<WorkerAiRightsTopic[]>(url);
  },

  emergencyContacts: () => http<WorkerAiEmergencyContact[]>(WORKER_AI_ENDPOINTS.emergencyContacts),

  languages: () => http<Array<{ code: LanguageCode; name: string; nativeName: string; supported: boolean }>>(WORKER_AI_ENDPOINTS.languages),

  translate: (input: TranslateInput) =>
    http<{ translated: string; detectedSource?: LanguageCode }>(WORKER_AI_ENDPOINTS.translate, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  usage: () => http<WorkerAiUsage>(WORKER_AI_ENDPOINTS.usage),
};
