import { workerAiApi } from './api.js';
import type { TrainingQuizInput, TranslateInput } from './api.js';

export const workerAiService = {
  chat: (input: Parameters<typeof workerAiApi.chat>[0]) => workerAiApi.chat(input),

  history: (conversationId: string, limit?: number) => workerAiApi.history(conversationId, limit),
  conversations: () => workerAiApi.conversations(),
  documents: () => workerAiApi.documents(),
  uploadDocument: (file: File, language?: Parameters<typeof workerAiApi.uploadDocument>[1]) => workerAiApi.uploadDocument(file, language),

  voiceTranscribe: (input: Parameters<typeof workerAiApi.voiceTranscribe>[0]) => workerAiApi.voiceTranscribe(input),
  voiceSynthesize: (input: Parameters<typeof workerAiApi.voiceSynthesize>[0]) => workerAiApi.voiceSynthesize(input),

  trainingQuiz: (input: TrainingQuizInput) => workerAiApi.trainingQuiz(input),
  trainingRecommendations: () => workerAiApi.trainingRecommendations(),
  trainingProgress: () => workerAiApi.trainingProgress(),

  knowledgeSearch: (query: string, opts?: Parameters<typeof workerAiApi.knowledgeSearch>[1]) => workerAiApi.knowledgeSearch(query, opts),
  rightsTopics: (language?: Parameters<typeof workerAiApi.rightsTopics>[0]) => workerAiApi.rightsTopics(language),
  emergencyContacts: () => workerAiApi.emergencyContacts(),
  languages: () => workerAiApi.languages(),
  translate: (input: TranslateInput) => workerAiApi.translate(input),
  usage: () => workerAiApi.usage(),
};
