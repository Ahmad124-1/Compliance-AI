-- 0018_engagement_wellbeing.sql
-- Sprint 6D: Worker Engagement & Wellbeing Intelligence Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pulse surveys
CREATE TABLE engagement_pulse_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT NOT NULL DEFAULT 'pulse',
  status TEXT NOT NULL DEFAULT 'draft',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_interval TEXT,
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  language TEXT NOT NULL DEFAULT 'en',
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_pulse_surveys_org ON engagement_pulse_surveys(organization_id);
CREATE INDEX idx_engagement_pulse_surveys_status ON engagement_pulse_surveys(status);

-- Survey responses
CREATE TABLE engagement_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES engagement_pulse_surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_score NUMERIC,
  sentiment TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_survey_responses_survey ON engagement_survey_responses(survey_id);
CREATE INDEX idx_engagement_survey_responses_user ON engagement_survey_responses(user_id);

-- Wellbeing self-assessments
CREATE TABLE engagement_wellbeing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL DEFAULT 'checkin',
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_wellbeing_score NUMERIC,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_wellbeing_user ON engagement_wellbeing_assessments(user_id);
CREATE INDEX idx_engagement_wellbeing_org ON engagement_wellbeing_assessments(organization_id);

-- Recognition types (badges, awards)
CREATE TABLE engagement_recognition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'peer',
  icon_url TEXT,
  points_value INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_recognition_types_org ON engagement_recognition_types(organization_id);

-- Recognition entries
CREATE TABLE engagement_recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recognition_type_id UUID REFERENCES engagement_recognition_types(id) ON DELETE SET NULL,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_manager_recognition BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'peer',
  related_entity_type TEXT,
  related_entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_recognitions_org ON engagement_recognitions(organization_id);
CREATE INDEX idx_engagement_recognitions_to_user ON engagement_recognitions(to_user_id);
CREATE INDEX idx_engagement_recognitions_from_user ON engagement_recognitions(from_user_id);

-- Recognition points ledger
CREATE TABLE engagement_recognitions_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recognition_id UUID NOT NULL REFERENCES engagement_recognitions(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_recognitions_points_user ON engagement_recognitions_points(user_id);
CREATE INDEX idx_engagement_recognitions_points_org ON engagement_recognitions_points(organization_id);

-- Goals & development
CREATE TABLE engagement_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL DEFAULT 'personal',
  status TEXT NOT NULL DEFAULT 'active',
  priority TEXT NOT NULL DEFAULT 'medium',
  progress INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_goals_user ON engagement_goals(user_id);
CREATE INDEX idx_engagement_goals_org ON engagement_goals(organization_id);

-- Community posts
CREATE TABLE engagement_community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL DEFAULT 'discussion',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_community_posts_org ON engagement_community_posts(organization_id);
CREATE INDEX idx_engagement_community_posts_user ON engagement_community_posts(user_id);

-- Community comments
CREATE TABLE engagement_community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES engagement_community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES engagement_community_comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_community_comments_post ON engagement_community_comments(post_id);

-- Events
CREATE TABLE engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'training',
  category TEXT NOT NULL DEFAULT 'general',
  location TEXT,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
  max_attendees INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_events_org ON engagement_events(organization_id);
CREATE INDEX idx_engagement_events_dates ON engagement_events(start_at, end_at);

-- Event attendance
CREATE TABLE engagement_event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES engagement_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  rsvp_status TEXT NOT NULL DEFAULT 'pending',
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX idx_engagement_event_attendance_event ON engagement_event_attendance(event_id);
CREATE INDEX idx_engagement_event_attendance_user ON engagement_event_attendance(user_id);

-- Daily engagement/wellbeing scores
CREATE TABLE engagement_daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  engagement_score NUMERIC,
  wellbeing_score NUMERIC,
  morale_score NUMERIC,
  communication_score NUMERIC,
  recognition_score NUMERIC,
  training_score NUMERIC,
  overall_score NUMERIC,
  data_sources JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, score_date)
);
CREATE INDEX idx_engagement_daily_scores_user ON engagement_daily_scores(user_id);
CREATE INDEX idx_engagement_daily_scores_date ON engagement_daily_scores(score_date);

-- AI engagement insights
CREATE TABLE engagement_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  affected_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_ai_insights_org ON engagement_ai_insights(organization_id);
CREATE INDEX idx_engagement_ai_insights_severity ON engagement_ai_insights(severity);

-- Analytics daily summaries
CREATE TABLE engagement_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  summary_date DATE NOT NULL,
  active_workers INTEGER NOT NULL DEFAULT 0,
  survey_responses INTEGER NOT NULL DEFAULT 0,
  avg_engagement_score NUMERIC,
  avg_wellbeing_score NUMERIC,
  avg_morale_score NUMERIC,
  recognition_count INTEGER NOT NULL DEFAULT 0,
  events_held INTEGER NOT NULL DEFAULT 0,
  event_attendance_count INTEGER NOT NULL DEFAULT 0,
  ai_insights_count INTEGER NOT NULL DEFAULT 0,
  participation_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_engagement_daily_summary_org ON engagement_daily_summary(organization_id);
CREATE INDEX idx_engagement_daily_summary_date ON engagement_daily_summary(summary_date);
