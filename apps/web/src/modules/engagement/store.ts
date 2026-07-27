'use client';

import { create } from 'zustand';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { engagementService } from './service.js';

interface EngagementUiState {
  filterPostType: string;
  filterEventType: string;
  filterSurveyStatus: string;
  setFilterPostType: (v: string) => void;
  setFilterEventType: (v: string) => void;
  setFilterSurveyStatus: (v: string) => void;
  reset: () => void;
}

export const useEngagementUiStore = create<EngagementUiState>((set) => ({
  filterPostType: '',
  filterEventType: '',
  filterSurveyStatus: '',
  setFilterPostType: (v) => set({ filterPostType: v }),
  setFilterEventType: (v) => set({ filterEventType: v }),
  setFilterSurveyStatus: (v) => set({ filterSurveyStatus: v }),
  reset: () => set({ filterPostType: '', filterEventType: '', filterSurveyStatus: '' }),
}));

export function useEngagementDashboard() {
  return useQuery({ queryKey: ['engagement-dashboard'], queryFn: () => engagementService.getDashboard() });
}

export function useManagerDashboard() {
  return useQuery({ queryKey: ['manager-dashboard'], queryFn: () => engagementService.getManagerDashboard() });
}

export function useEngagementTrends(period?: string, siteId?: string, departmentId?: string) {
  return useQuery({ queryKey: ['engagement-trends', period, siteId, departmentId], queryFn: () => engagementService.getTrends(period, siteId, departmentId) });
}

export function useParticipationTrends(period?: string) {
  return useQuery({ queryKey: ['participation-trends', period], queryFn: () => engagementService.getParticipationTrends(period) });
}

export function useDepartmentComparison() {
  return useQuery({ queryKey: ['department-comparison'], queryFn: () => engagementService.getDepartmentComparison() });
}

export function useWellbeingTrends(userId?: string, period?: string) {
  return useQuery({ queryKey: ['wellbeing-trends', userId, period], queryFn: () => engagementService.getWellbeingTrends(userId, period) });
}

export function useAiInsights(params?: { isRead?: boolean; isResolved?: boolean }) {
  return useQuery({ queryKey: ['ai-insights', params], queryFn: () => engagementService.getAiInsights(params) });
}

export function useGenerateAiInsights() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: () => engagementService.generateAiInsights() });
  return {
    mutateAsync: () => mutation.mutateAsync(),
    invalidate: () => qc.invalidateQueries({ queryKey: ['ai-insights'] }),
    isLoading: mutation.isPending,
  };
}

export function useSurveys(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['surveys', params], queryFn: () => engagementService.listSurveys(params) });
}

export function useSurvey(id?: string) {
  return useQuery({ queryKey: ['survey', id], queryFn: () => engagementService.getSurvey(id as string), enabled: !!id });
}

export function useCreateSurvey() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => engagementService.createSurvey(data) });
  return {
    mutateAsync: (data: Record<string, unknown>) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    isLoading: mutation.isPending,
  };
}

export function useUpdateSurvey() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => engagementService.updateSurvey(id, data) });
  return {
    mutateAsync: ({ id, data }: { id: string; data: Record<string, unknown> }) => mutation.mutateAsync({ id, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    isLoading: mutation.isPending,
  };
}

export function useSubmitResponse() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (args: { surveyId: string; data: { answers: Record<string, unknown>; overallScore?: number | null; sentiment?: string | null } }) => engagementService.submitResponse(args.surveyId, args.data) });
  return {
    mutateAsync: (surveyId: string, data: { answers: Record<string, unknown>; overallScore?: number | null; sentiment?: string | null }) => mutation.mutateAsync({ surveyId, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['surveys'] }),
    isLoading: mutation.isPending,
  };
}

export function useSurveyAnalytics(id?: string) {
  return useQuery({ queryKey: ['survey-analytics', id], queryFn: () => engagementService.getSurveyAnalytics(id as string), enabled: !!id });
}

export function useAiSummarizeSurvey(id?: string) {
  return useQuery({ queryKey: ['survey-ai-summary', id], queryFn: () => engagementService.aiSummarizeSurvey(id as string), enabled: !!id });
}

export function useRecognitionTypes() {
  return useQuery({ queryKey: ['recognition-types'], queryFn: () => engagementService.listRecognitionTypes() });
}

export function useCreateRecognitionType() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => engagementService.createRecognitionType(data) });
  return {
    mutateAsync: (data: Record<string, unknown>) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['recognition-types'] }),
    isLoading: mutation.isPending,
  };
}

export function useUpdateRecognitionType() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => engagementService.updateRecognitionType(id, data) });
  return {
    mutateAsync: ({ id, data }: { id: string; data: Record<string, unknown> }) => mutation.mutateAsync({ id, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['recognition-types'] }),
    isLoading: mutation.isPending,
  };
}

export function useRecognitions(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['recognitions', params], queryFn: () => engagementService.listRecognitions(params) });
}

export function useCreateRecognition() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => engagementService.createRecognition(data) });
  return {
    mutateAsync: (data: Record<string, unknown>) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['recognitions'] }),
    isLoading: mutation.isPending,
  };
}

export function useLeaderboard(params?: { period?: string; siteId?: string; departmentId?: string }) {
  return useQuery({ queryKey: ['leaderboard', params], queryFn: () => engagementService.getLeaderboard(params) });
}

export function useRecognitionHistory(params?: { userId?: string }) {
  return useQuery({ queryKey: ['recognition-history', params], queryFn: () => engagementService.getRecognitionHistory(params) });
}

export function useMyPoints() {
  return useQuery({ queryKey: ['my-points'], queryFn: () => engagementService.getMyPoints() });
}

export function useAssessments(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['wellbeing-assessments', params], queryFn: () => engagementService.listAssessments(params) });
}

export function useSelfAssess() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: { assessmentType: string; scores: Record<string, unknown>; indicators?: any[] }) => engagementService.selfAssess(data) });
  return {
    mutateAsync: (data: { assessmentType: string; scores: Record<string, unknown>; indicators?: any[] }) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['wellbeing-assessments'] }),
    isLoading: mutation.isPending,
  };
}

export function useWellbeingTips(topic?: string) {
  return useQuery({ queryKey: ['wellbeing-tips', topic], queryFn: () => engagementService.getWellbeingTips(topic) });
}

export function useCheckinHistory() {
  return useQuery({ queryKey: ['checkin-history'], queryFn: () => engagementService.getCheckinHistory() });
}

export function useBurnoutRisk() {
  return useQuery({ queryKey: ['burnout-risk'], queryFn: () => engagementService.detectBurnoutRisk() });
}

export function usePosts(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['community-posts', params], queryFn: () => engagementService.listPosts(params) });
}

export function usePost(id?: string) {
  return useQuery({ queryKey: ['community-post', id], queryFn: () => engagementService.getPost(id as string), enabled: !!id });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => engagementService.createPost(data) });
  return {
    mutateAsync: (data: Record<string, unknown>) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
    isLoading: mutation.isPending,
  };
}

export function useUpdatePost() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => engagementService.updatePost(id, data) });
  return {
    mutateAsync: ({ id, data }: { id: string; data: Record<string, unknown> }) => mutation.mutateAsync({ id, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
    isLoading: mutation.isPending,
  };
}

export function useDeletePost() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (id: string) => engagementService.deletePost(id) });
  return {
    mutateAsync: (id: string) => mutation.mutateAsync(id),
    invalidate: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
    isLoading: mutation.isPending,
  };
}

export function useComments(postId?: string) {
  return useQuery({ queryKey: ['community-comments', postId], queryFn: () => engagementService.listComments(postId as string), enabled: !!postId });
}

export function useCreateComment() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: ({ postId, data }: { postId: string; data: Record<string, unknown> }) => engagementService.createComment(postId, data) });
  return {
    mutateAsync: ({ postId, data }: { postId: string; data: Record<string, unknown> }) => mutation.mutateAsync({ postId, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
    isLoading: mutation.isPending,
  };
}

export function useLikePost() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (id: string) => engagementService.likePost(id) });
  return {
    mutateAsync: (id: string) => mutation.mutateAsync(id),
    invalidate: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
    isLoading: mutation.isPending,
  };
}

export function useEvents(params?: Record<string, string | undefined>) {
  return useQuery({ queryKey: ['events', params], queryFn: () => engagementService.listEvents(params) });
}

export function useEvent(id?: string) {
  return useQuery({ queryKey: ['event', id], queryFn: () => engagementService.getEvent(id as string), enabled: !!id });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (data: Record<string, unknown>) => engagementService.createEvent(data) });
  return {
    mutateAsync: (data: Record<string, unknown>) => mutation.mutateAsync(data),
    invalidate: () => qc.invalidateQueries({ queryKey: ['events'] }),
    isLoading: mutation.isPending,
  };
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => engagementService.updateEvent(id, data) });
  return {
    mutateAsync: ({ id, data }: { id: string; data: Record<string, unknown> }) => mutation.mutateAsync({ id, data }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['events'] }),
    isLoading: mutation.isPending,
  };
}

export function useRegisterForEvent() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (args: { id: string; rsvpStatus?: string }) => engagementService.registerForEvent(args.id, args.rsvpStatus) });
  return {
    mutateAsync: (id: string, rsvpStatus?: string) => mutation.mutateAsync({ id, rsvpStatus }),
    invalidate: () => qc.invalidateQueries({ queryKey: ['events'] }),
    isLoading: mutation.isPending,
  };
}

export function useSignInToEvent() {
  const qc = useQueryClient();
  const mutation = useMutation({ mutationFn: (id: string) => engagementService.signInToEvent(id) });
  return {
    mutateAsync: (id: string) => mutation.mutateAsync(id),
    invalidate: () => qc.invalidateQueries({ queryKey: ['events'] }),
    isLoading: mutation.isPending,
  };
}

export function useEventAttendance(id?: string) {
  return useQuery({ queryKey: ['event-attendance', id], queryFn: () => engagementService.getEventAttendance(id as string), enabled: !!id });
}

export function useEventStats(id?: string) {
  return useQuery({ queryKey: ['event-stats', id], queryFn: () => engagementService.getEventStats(id as string), enabled: !!id });
}
