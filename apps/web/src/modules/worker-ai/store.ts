'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { workerAiService } from './service.js';

export function useWorkerAiChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId: string; message: string; language?: string; useRag?: boolean }) =>
      workerAiService.chat(input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-ai'] }),
  });
}

export function useWorkerAiHistory(conversationId: string) {
  return useQuery({
    queryKey: ['worker-ai', 'history', conversationId],
    queryFn: () => workerAiService.history(conversationId),
    enabled: !!conversationId,
  });
}

export function useWorkerAiConversations() {
  return useQuery({
    queryKey: ['worker-ai', 'conversations'],
    queryFn: () => workerAiService.conversations(),
  });
}

export function useWorkerAiDocuments() {
  return useQuery({
    queryKey: ['worker-ai', 'documents'],
    queryFn: () => workerAiService.documents(),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, language }: { file: File; language?: string }) => workerAiService.uploadDocument(file, language as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-ai', 'documents'] }),
  });
}

export function useVoiceTranscribe() {
  return useMutation({
    mutationFn: (input: { audio: string; language?: string }) => workerAiService.voiceTranscribe(input as any),
  });
}

export function useVoiceSynthesize() {
  return useMutation({
    mutationFn: (input: { text: string; language?: string; voice?: string }) => workerAiService.voiceSynthesize(input as any),
  });
}

export function useTrainingQuiz() {
  return useMutation({
    mutationFn: (input: { topic: string; difficulty?: string; count?: number }) => workerAiService.trainingQuiz(input as any),
  });
}

export function useTrainingRecommendations() {
  return useQuery({
    queryKey: ['worker-ai', 'training', 'recommendations'],
    queryFn: () => workerAiService.trainingRecommendations(),
  });
}

export function useTrainingProgress() {
  return useQuery({
    queryKey: ['worker-ai', 'training', 'progress'],
    queryFn: () => workerAiService.trainingProgress(),
  });
}

export function useKnowledgeSearch(query: string, opts?: { category?: string; language?: string }) {
  return useQuery({
    queryKey: ['worker-ai', 'knowledge', query, opts],
    queryFn: () => workerAiService.knowledgeSearch(query, opts as any),
    enabled: query.length > 0,
  });
}

export function useRightsTopics(language?: string) {
  return useQuery({
    queryKey: ['worker-ai', 'rights', language],
    queryFn: () => workerAiService.rightsTopics(language as any),
    enabled: true,
  });
}

export function useEmergencyContacts() {
  return useQuery({
    queryKey: ['worker-ai', 'emergency', 'contacts'],
    queryFn: () => workerAiService.emergencyContacts(),
  });
}

export function useLanguages() {
  return useQuery({
    queryKey: ['worker-ai', 'languages'],
    queryFn: () => workerAiService.languages(),
  });
}

export function useTranslate() {
  return useMutation({
    mutationFn: (input: { text: string; source?: string; target: string }) => workerAiService.translate(input as any),
  });
}

export function useAiUsage() {
  return useQuery({
    queryKey: ['worker-ai', 'usage'],
    queryFn: () => workerAiService.usage(),
  });
}
