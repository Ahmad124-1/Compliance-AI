import { Heart, TrendingUp, Users, MessageSquare, Award, Target, Calendar, FileText, BarChart3 } from 'lucide-react';

export const ENGAGEMENT_ROUTES = {
  dashboard: '/workers/engagement',
  surveys: '/workers/engagement/surveys',
  surveyBuilder: '/workers/engagement/surveys/builder',
  surveyResponse: '/workers/engagement/surveys/response',
  surveyAnalytics: '/workers/engagement/surveys/analytics',
  recognition: '/workers/engagement/recognition',
  recognitionLeaderboard: '/workers/engagement/recognition/leaderboard',
  recognitionHistory: '/workers/engagement/recognition/history',
  wellbeing: '/workers/engagement/wellbeing',
  wellbeingCheckin: '/workers/engagement/wellbeing/checkin',
  wellbeingTips: '/workers/engagement/wellbeing/tips',
  goals: '/workers/engagement/goals',
  community: '/workers/engagement/community',
  events: '/workers/engagement/events',
  eventDetail: '/workers/engagement/events/detail',
  aiInsights: '/workers/engagement/ai-insights',
  managerDashboard: '/workers/engagement/manager',
  analytics: '/workers/engagement/analytics',
};

export const SURVEY_TYPES = ['pulse', 'engagement', 'wellbeing', 'safety', 'satisfaction', 'exit', 'onboarding'];
export const EVENT_TYPES = ['training', 'safety_meeting', 'audit', 'town_hall', 'factory_announcement'];
export const WELLBEING_TYPES = ['daily', 'weekly', 'monthly', 'custom'];

export const ENGAGEMENT_ICONS = {
  dashboard: BarChart3,
  surveys: FileText,
  recognition: Award,
  wellbeing: Heart,
  goals: Target,
  community: MessageSquare,
  events: Calendar,
  insights: TrendingUp,
  manager: Users,
  analytics: BarChart3,
};
