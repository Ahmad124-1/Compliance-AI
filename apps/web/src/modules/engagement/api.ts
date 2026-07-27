import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import type {
  EngagementDashboard,
  ManagerDashboard,
  EngagementPulseSurvey,
  EngagementSurveyResponse,
  EngagementWellbeingAssessment,
  EngagementRecognitionType,
  EngagementRecognition,
  EngagementCommunityPost,
  EngagementCommunityComment,
  EngagementEvent,
  EngagementEventAttendance,
  EngagementAiInsight,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

const API_BASE = '/api/v1/engagement';

export const engagementApi = {
  getDashboard: () => http<EngagementDashboard>(`${API_BASE}/dashboard`),
  getManagerDashboard: () => http<ManagerDashboard>(`${API_BASE}/manager/dashboard`),
  getTrends: (period?: string, siteId?: string, departmentId?: string) => {
    const qs = new URLSearchParams();
    if (period) qs.set('period', period);
    if (siteId) qs.set('siteId', siteId);
    if (departmentId) qs.set('departmentId', departmentId);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<any[]>(`${API_BASE}/trends${suffix}`);
  },
  getParticipationTrends: (period?: string) => http<any[]>(`${API_BASE}/participation/trends?period=${period || 'month'}`),
  getDepartmentComparison: () => http<any[]>(`${API_BASE}/departments/comparison`),
  getWellbeingTrends: (userId?: string, period?: string) => {
    const qs = new URLSearchParams();
    if (userId) qs.set('userId', userId);
    if (period) qs.set('period', period);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<any[]>(`${API_BASE}/wellbeing/trends${suffix}`);
  },
  getAiInsights: (params?: { isRead?: boolean; isResolved?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.isRead !== undefined) qs.set('isRead', String(params.isRead));
    if (params?.isResolved !== undefined) qs.set('isResolved', String(params.isResolved));
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementAiInsight[]>(`${API_BASE}/ai/insights${suffix}`);
  },
  generateAiInsights: () => http<any[]>(`${API_BASE}/ai/insights/generate`, { method: 'POST' }),

  listSurveys: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.departmentId) qs.set('departmentId', params.departmentId);
    if (params?.siteId) qs.set('siteId', params.siteId);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementPulseSurvey[]>(`${API_BASE}/surveys${suffix}`);
  },
  getSurvey: (id: string) => http<EngagementPulseSurvey & { responseCount: number; avgScore: number }>(`${API_BASE}/surveys/${id}`),
  createSurvey: (data: Record<string, unknown>) => http<EngagementPulseSurvey>(`${API_BASE}/surveys`, { method: 'POST', body: JSON.stringify(data) }),
  updateSurvey: (id: string, data: Record<string, unknown>) => http<EngagementPulseSurvey>(`${API_BASE}/surveys/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitResponse: (surveyId: string, data: { answers: Record<string, unknown>; overallScore?: number | null; sentiment?: string | null }) =>
    http<EngagementSurveyResponse>(`${API_BASE}/surveys/${surveyId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
  getSurveyAnalytics: (id: string) => http<any>(`${API_BASE}/surveys/${id}/analytics`),
  aiSummarizeSurvey: (id: string) => http<any>(`${API_BASE}/surveys/${id}/ai-summarize`, { method: 'POST' }),

  listRecognitionTypes: () => http<EngagementRecognitionType[]>(`${API_BASE}/recognition/types`),
  createRecognitionType: (data: Record<string, unknown>) => http<EngagementRecognitionType>(`${API_BASE}/recognition/types`, { method: 'POST', body: JSON.stringify(data) }),
  updateRecognitionType: (id: string, data: Record<string, unknown>) => http<EngagementRecognitionType>(`${API_BASE}/recognition/types/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  listRecognitions: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params?.toUserId) qs.set('toUserId', params.toUserId);
    if (params?.fromUserId) qs.set('fromUserId', params.fromUserId);
    if (params?.category) qs.set('category', params.category);
    if (params?.limit) qs.set('limit', params.limit);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementRecognition[]>(`${API_BASE}/recognition${suffix}`);
  },
  createRecognition: (data: Record<string, unknown>) => http<EngagementRecognition>(`${API_BASE}/recognition`, { method: 'POST', body: JSON.stringify(data) }),
  getLeaderboard: (params?: { period?: string; siteId?: string; departmentId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.period) qs.set('period', params.period);
    if (params?.siteId) qs.set('siteId', params.siteId);
    if (params?.departmentId) qs.set('departmentId', params.departmentId);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<any[]>(`${API_BASE}/recognition/leaderboard${suffix}`);
  },
  getRecognitionHistory: (params?: { userId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set('userId', params.userId);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementRecognition[]>(`${API_BASE}/recognition/history${suffix}`);
  },
  getMyPoints: () => http<number>(`${API_BASE}/recognition/my-points`),

  listAssessments: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params?.assessmentType) qs.set('assessmentType', params.assessmentType);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementWellbeingAssessment[]>(`${API_BASE}/wellbeing/assessments${suffix}`);
  },
  selfAssess: (data: { assessmentType: string; scores: Record<string, unknown>; indicators?: any[] }) =>
    http<EngagementWellbeingAssessment>(`${API_BASE}/wellbeing/assessments`, { method: 'POST', body: JSON.stringify(data) }),
  getWellbeingTips: (topic?: string) => http<any[]>(`${API_BASE}/wellbeing/tips${topic ? `?topic=${topic}` : ''}`),
  getCheckinHistory: () => http<EngagementWellbeingAssessment[]>(`${API_BASE}/wellbeing/checkin/history`),
  detectBurnoutRisk: () => http<any>(`${API_BASE}/wellbeing/burnout-risk`),

  listPosts: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params?.postType) qs.set('postType', params.postType);
    if (params?.category) qs.set('category', params.category);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementCommunityPost[]>(`${API_BASE}/community/posts${suffix}`);
  },
  getPost: (id: string) => http<(EngagementCommunityPost & { comments: EngagementCommunityComment[] })>(`${API_BASE}/community/posts/${id}`),
  createPost: (data: Record<string, unknown>) => http<EngagementCommunityPost>(`${API_BASE}/community/posts`, { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: string, data: Record<string, unknown>) => http<EngagementCommunityPost>(`${API_BASE}/community/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePost: (id: string) => http<{ success: boolean }>(`${API_BASE}/community/posts/${id}`, { method: 'DELETE' }),
  listComments: (postId: string) => http<EngagementCommunityComment[]>(`${API_BASE}/community/posts/${postId}/comments`),
  createComment: (postId: string, data: Record<string, unknown>) => http<EngagementCommunityComment>(`${API_BASE}/community/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  likePost: (id: string) => http<EngagementCommunityPost>(`${API_BASE}/community/posts/${id}/like`, { method: 'POST' }),

  listEvents: (params?: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    if (params?.eventType) qs.set('eventType', params.eventType);
    if (params?.status) qs.set('status', params.status);
    if (params?.siteId) qs.set('siteId', params.siteId);
    if (params?.departmentId) qs.set('departmentId', params.departmentId);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EngagementEvent[]>(`${API_BASE}/events${suffix}`);
  },
  getEvent: (id: string) => http<(EngagementEvent & { stats: any })>(`${API_BASE}/events/${id}`),
  createEvent: (data: Record<string, unknown>) => http<EngagementEvent>(`${API_BASE}/events`, { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: Record<string, unknown>) => http<EngagementEvent>(`${API_BASE}/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  registerForEvent: (id: string, rsvpStatus?: string) =>
    http<EngagementEventAttendance>(`${API_BASE}/events/${id}/register`, { method: 'POST', body: JSON.stringify({ rsvpStatus: rsvpStatus || 'accepted' }) }),
  signInToEvent: (id: string) => http<EngagementEventAttendance>(`${API_BASE}/events/${id}/sign-in`, { method: 'POST' }),
  signOutOfEvent: (id: string) => http<EngagementEventAttendance>(`${API_BASE}/events/${id}/sign-out`, { method: 'POST' }),
  getEventAttendance: (id: string) => http<EngagementEventAttendance[]>(`${API_BASE}/events/${id}/attendance`),
  getEventStats: (id: string) => http<any>(`${API_BASE}/events/${id}/stats`),
};
