export interface EngagementPulseSurvey {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  surveyType: string;
  status: string;
  questions: any[];
  isAnonymous: boolean;
  isRecurring: boolean;
  recurrenceInterval: string | null;
  targetAudience: Record<string, unknown>;
  departmentId: string | null;
  siteId: string | null;
  language: string;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementSurveyResponse {
  id: string;
  organizationId: string;
  surveyId: string;
  userId: string | null;
  answers: Record<string, unknown>;
  overallScore: number | null;
  sentiment: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface EngagementWellbeingAssessment {
  id: string;
  organizationId: string;
  userId: string;
  assessmentType: string;
  scores: Record<string, unknown>;
  indicators: any[];
  tips: any[];
  overallWellbeingScore: number | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface EngagementRecognitionType {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string | null;
  pointsValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementRecognition {
  id: string;
  organizationId: string;
  recognitionTypeId: string | null;
  fromUserId: string;
  toUserId: string;
  message: string;
  pointsAwarded: number;
  isPublic: boolean;
  isManagerRecognition: boolean;
  category: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementRecognitionPoints {
  id: string;
  organizationId: string;
  userId: string;
  recognitionId: string;
  points: number;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface EngagementGoal {
  id: string;
  organizationId: string;
  userId: string;
  managerId: string | null;
  title: string;
  description: string;
  goalType: string;
  status: string;
  priority: string;
  progress: number;
  targetDate: string | null;
  completedAt: string | null;
  milestones: any[];
  skills: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementCommunityPost {
  id: string;
  organizationId: string;
  userId: string;
  postType: string;
  title: string;
  body: string;
  category: string | null;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isAnonymous: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementCommunityComment {
  id: string;
  organizationId: string;
  postId: string;
  userId: string;
  parentCommentId: string | null;
  body: string;
  likesCount: number;
  isAnonymous: boolean;
  createdAt: string;
}

export interface EngagementEvent {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  eventType: string;
  category: string;
  location: string | null;
  siteId: string | null;
  departmentId: string | null;
  startAt: string;
  endAt: string | null;
  isAllDay: boolean;
  maxAttendees: number | null;
  status: string;
  organizerId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementEventAttendance {
  id: string;
  organizationId: string;
  eventId: string;
  userId: string;
  status: string;
  rsvpStatus: string;
  feedback: Record<string, unknown>;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementAiInsight {
  id: string;
  organizationId: string;
  insightType: string;
  severity: string;
  title: string;
  description: string;
  recommendations: any[];
  affectedScope: Record<string, unknown>;
  data: Record<string, unknown>;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementDailyScore {
  id: string;
  organizationId: string;
  userId: string;
  scoreDate: string;
  engagementScore: number | null;
  wellbeingScore: number | null;
  moraleScore: number | null;
  communicationScore: number | null;
  recognitionScore: number | null;
  trainingScore: number | null;
  overallScore: number | null;
  dataSources: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementDailySummary {
  id: string;
  organizationId: string;
  siteId: string | null;
  departmentId: string | null;
  summaryDate: string;
  activeWorkers: number;
  surveyResponses: number;
  avgEngagementScore: number | null;
  avgWellbeingScore: number | null;
  avgMoraleScore: number | null;
  recognitionCount: number;
  eventsHeld: number;
  eventAttendanceCount: number;
  aiInsightsCount: number;
  participationRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementAiInsightInput {
  organizationId: string;
  insightType: string;
  severity?: string;
  title: string;
  description: string;
  recommendations?: any[];
  affectedScope?: Record<string, unknown>;
  data?: Record<string, unknown>;
}
