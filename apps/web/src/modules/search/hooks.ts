'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { searchService } from './service.js';
import type { SearchParams } from './types.js';

export const useGlobalSearch = (params: SearchParams | null, enabled = true) => {
  return useQuery({
    queryKey: ['search', 'global', params],
    queryFn: () => searchService.search(params as SearchParams),
    enabled: enabled && !!params && params.term.trim().length > 0,
    staleTime: 15 * 1000,
    placeholderData: (prev) => prev,
  });
};

export const useSavedSearches = () => {
  return useQuery({
    queryKey: ['search', 'saved'],
    queryFn: () => searchService.listSaved(),
    staleTime: 60 * 1000,
  });
};

export const useRecentSearches = () => {
  return useQuery({
    queryKey: ['search', 'recent'],
    queryFn: () => searchService.listRecent(),
    staleTime: 30 * 1000,
  });
};

export const useSaveSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; scope: string; query: string; filters?: Record<string, unknown>; isGlobal?: boolean }) =>
      searchService.save(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search', 'saved'] }),
  });
};

export const useDeleteSavedSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => searchService.deleteSaved(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search', 'saved'] }),
  });
};

export const useClearRecentSearches = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => searchService.clearRecent(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['search', 'recent'] }),
  });
};
