'use client';

import { useQuery } from '@tanstack/react-query';

import { auditService } from './service.js';
import type { AuditQueryFilters } from './types.js';

export const useAuditLogs = (filters: AuditQueryFilters) =>
  useQuery({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => auditService.list(filters),
    placeholderData: (prev) => prev,
  });

export const useAuditActions = () =>
  useQuery({
    queryKey: ['audit', 'actions'],
    queryFn: () => auditService.actions(),
    staleTime: 5 * 60 * 1000,
  });

export const useAuditExport = () => {
  return useQuery({
    queryKey: ['audit', 'export'],
    queryFn: () => auditService.export({ limit: 10000 }),
    enabled: false,
    staleTime: 60 * 1000,
  });
};
