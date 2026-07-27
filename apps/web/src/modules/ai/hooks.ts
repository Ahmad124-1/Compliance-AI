'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { aiService } from './service.js';
import { useAiStore } from './store.js';
import type {
  AiConfig,
  VectorSearchHit,
  RagContext,
  RagResult,
  MemoryRecord,
  UsageResponse,
  ChatMessageTurn,
} from './types.js';

export function useAiCapabilities() {
  const setProviders = useAiStore((s) => s.setProviders);
  return useQuery({
    queryKey: ['ai', 'capabilities'],
    queryFn: async () => {
      const data = await aiService.capabilities();
      setProviders(data.providers as any);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAiConfig() {
  return useQuery({ queryKey: ['ai', 'config'], queryFn: () => aiService.getConfig() });
}

export function useUpdateAiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AiConfig>) => aiService.updateConfig(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'config'] }),
  });
}

export function useAiProviders() {
  return useQuery({ queryKey: ['ai', 'providers'], queryFn: () => aiService.providers() });
}

export function useAiPrompts() {
  return useQuery({ queryKey: ['ai', 'prompts'], queryFn: () => aiService.listPrompts() });
}

export function useCreatePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { key: string; name: string; content: string; description?: string | null; category?: string; variables?: string[]; isDefault?: boolean }) =>
      aiService.createPrompt(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'prompts'] }),
  });
}

export function useKnowledgeStandards() {
  return useQuery({ queryKey: ['ai', 'knowledge', 'standards'], queryFn: () => aiService.knowledgeStandards() });
}

export function useIngestDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { domain: any; title: string; content: string; standardId?: string; language?: string; metadata?: Record<string, unknown>; index?: boolean }) =>
      aiService.ingest(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'knowledge'] }),
  });
}

export function useVectorSearch() {
  return useMutation<VectorSearchHit[], Error, { query: string; domains?: string[]; limit?: number; minScore?: number }>({
    mutationFn: ({ query, domains, limit, minScore }) => aiService.vectorSearch(query, { domains, limit, minScore }),
  });
}

export function useIndexKnowledgeBase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => aiService.indexKbJob(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'jobs'] }),
  });
}

export function useRag() {
  return useMutation<RagResult, Error, { query: string; supplierId?: string; auditId?: string; grievanceId?: string; capaId?: string; domains?: string[]; topK?: number; retrieveOnly?: boolean }>({
    mutationFn: (input) => aiService.rag(input),
  });
}

export function useRagContext() {
  return useMutation<RagContext, Error, { query: string; supplierId?: string; auditId?: string }>({
    mutationFn: ({ query, supplierId, auditId }) => aiService.ragContext(query, { supplierId, auditId }),
  });
}

export function useChat() {
  return useMutation<{ text: string; model: string; provider: string }, Error, { conversationId: string; message: string; supplierId?: string; auditId?: string; useRag?: boolean; systemPrompt?: string }>({
    mutationFn: (input) => aiService.chat(input),
  });
}

export function useMemoryScope(scope: string, scopeId?: string) {
  return useQuery({
    queryKey: ['ai', 'memory', scope, scopeId ?? ''],
    queryFn: () => aiService.memoryScope(scope, scopeId) as Promise<MemoryRecord[] | ChatMessageTurn[]>,
    enabled: Boolean(scope),
  });
}

export function useAiJobs(status?: string) {
  return useQuery({ queryKey: ['ai', 'jobs', status ?? 'all'], queryFn: () => aiService.jobs(status) });
}

export function useAiJobStats() {
  return useQuery({ queryKey: ['ai', 'jobs', 'stats'], queryFn: () => aiService.jobStats() });
}

export function useAiUsage(days = 30) {
  return useQuery({ queryKey: ['ai', 'usage', days], queryFn: () => aiService.usage(days) as Promise<UsageResponse> });
}
