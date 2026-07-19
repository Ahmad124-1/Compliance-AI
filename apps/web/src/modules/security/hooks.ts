'use client';

import { useQuery } from '@tanstack/react-query';

import { securityService } from './api.js';

export const useSecurityReview = () =>
  useQuery({
    queryKey: ['security', 'review'],
    queryFn: () => securityService.review(),
    staleTime: 60 * 1000,
  });
