'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { aiService } from './service.js';
import { useAiStore } from './store.js';
import type { AnalyzeComplaintInput, TranslationResult } from './types.js';

export function useAiCapabilities() {
  const setCapabilities = useAiStore((s) => s.setCapabilities);
  return useQuery({
    queryKey: ['ai', 'capabilities'],
    queryFn: async () => {
      const data = await aiService.capabilities();
      setCapabilities(data.provider, data.capabilities);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyzeComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnalyzeComplaintInput) => aiService.analyze(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai'] });
    },
  });
}

export function useTranslate() {
  return useMutation<TranslationResult | null, Error, { text: string; source: string; target: string }>({
    mutationFn: ({ text, source, target }) => aiService.translate(text, source, target),
  });
}
