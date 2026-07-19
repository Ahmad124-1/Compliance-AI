-- 0006_sprint_3c.sql
-- Sprint 3C: Omnichannel Communication, Notifications, Escalation, QR Management, Analytics

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system', -- assignment | status_update | escalation | reminder | resolution | comment | evidence_request | investigation_started | investigation_completed | case_closed | system
  channel TEXT NOT NULL DEFAULT 'in_app', -- in_app | email | sms | whatsapp | push | voice
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_org_user ON notifications(organization_id, user_id);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_channel ON notifications(channel);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- in_app | email | sms | whatsapp | push | voice
  notification_type TEXT NOT NULL, -- assignment | status_update | escalation | reminder | resolution | comment | evidence_request | investigation_started | investigation_completed | case_closed | system
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, channel, notification_type)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(organization_id, user_id);

CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | queued | sending | sent | delivered | failed | bounced | rejected
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL, -- email | sms | whatsapp | push | voice
  type TEXT NOT NULL, -- assignment | status_update | escalation | reminder | resolution | comment | evidence_request | investigation_started | investigation_completed | case_closed | system
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  locale TEXT NOT NULL DEFAULT 'en',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_templates_org ON message_templates(organization_id);
CREATE INDEX idx_message_templates_channel ON message_templates(channel);
CREATE INDEX idx_message_templates_type ON message_templates(type);

-- ============================================================================
-- SLA ENGINE
-- ============================================================================

CREATE TABLE sla_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sla_type TEXT NOT NULL, -- response | investigation | resolution | escalation
  priority TEXT NOT NULL, -- low | medium | high | critical
  severity TEXT, -- low | medium | high | critical
  category TEXT,
  target_duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_definitions_org ON sla_definitions(organization_id);
CREATE INDEX idx_sla_definitions_type ON sla_definitions(sla_type);

CREATE TABLE sla_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sla_definition_id UUID NOT NULL REFERENCES sla_definitions(id) ON DELETE CASCADE,
  sla_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | breached | met | cancelled
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ NOT NULL,
  met_at TIMESTAMPTZ,
  breached_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_instances_case ON sla_instances(case_id);
CREATE INDEX idx_sla_instances_status ON sla_instances(status);
CREATE INDEX idx_sla_instances_deadline ON sla_instances(deadline);

CREATE TABLE sla_pause_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_instance_id UUID NOT NULL REFERENCES sla_instances(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  paused_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_pause_history_instance ON sla_pause_history(sla_instance_id);

CREATE TABLE sla_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, day_of_week)
);

CREATE INDEX idx_sla_working_hours_org ON sla_working_hours(organization_id);

CREATE TABLE sla_holiday_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, date)
);

CREATE INDEX idx_sla_holiday_calendar_org ON sla_holiday_calendar(organization_id, date);

-- ============================================================================
-- ESCALATION ENGINE
-- ============================================================================

CREATE TABLE escalation_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1),
  description TEXT,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  notify_roles UUID[] DEFAULT '{}',
  auto_escalate_after_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, level)
);

CREATE INDEX idx_escalation_levels_org ON escalation_levels(organization_id);

-- Enhanced escalation rules
CREATE TABLE escalation_rules_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL, -- time_sla | priority | severity | category | factory | department | country | organization
  condition_value TEXT NOT NULL,
  condition_operator TEXT NOT NULL DEFAULT 'equals', -- equals | not_equals | contains | gt | lt | gte | lte
  escalate_to_level_id UUID REFERENCES escalation_levels(id) ON DELETE SET NULL,
  escalate_to_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  escalate_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notification_channels TEXT[] DEFAULT '{in_app,email}',
  auto_escalate BOOLEAN NOT NULL DEFAULT FALSE,
  auto_escalate_after_minutes INTEGER,
  require_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_escalation_rules_v2_org ON escalation_rules_v2(organization_id);

-- ============================================================================
-- QR MANAGEMENT
-- ============================================================================

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- organization | factory | department | campaign | poster
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  scan_count INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_codes_org ON qr_codes(organization_id);
CREATE INDEX idx_qr_codes_type ON qr_codes(type);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);

CREATE TABLE qr_scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  browser TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_scan_events_qr_code ON qr_scan_events(qr_code_id, created_at DESC);
CREATE INDEX idx_qr_scan_events_org_date ON qr_scan_events(organization_id, created_at DESC);

-- ============================================================================
-- WORKER COMMUNICATION
-- ============================================================================

CREATE TABLE worker_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL, -- status_change | case_update | public_message | additional_info_request | acknowledgement | resolution_notice | case_closed | feedback_request
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  recipient_type TEXT NOT NULL, -- reporter | assigned_to | watchers | all
  recipient_ids UUID[] DEFAULT '{}',
  channel TEXT NOT NULL DEFAULT 'in_app',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_status_updates_case ON worker_status_updates(case_id);
CREATE INDEX idx_worker_status_updates_org ON worker_status_updates(organization_id);

CREATE TABLE worker_communication_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL, -- system | user | worker
  action TEXT NOT NULL, -- message_sent | status_changed | acknowledged | feedback_submitted
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_communication_timeline_case ON worker_communication_timeline(case_id);
CREATE INDEX idx_worker_communication_timeline_org ON worker_communication_timeline(organization_id);

-- ============================================================================
-- ORGANIZATION COMMUNICATION SETTINGS
-- ============================================================================

CREATE TABLE organization_communication_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  default_language TEXT NOT NULL DEFAULT 'en',
  supported_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_address TEXT,
  sms_sender_id TEXT,
  whatsapp_number TEXT,
  hotline_number TEXT,
  voice_recording_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  suggestion_box_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  walk_in_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  union_channel_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ngo_channel_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  government_channel_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mobile_app_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  retention_policy_days INTEGER DEFAULT 2555,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_comm_settings_org ON organization_communication_settings(organization_id);

-- ============================================================================
-- ANALYTICS
-- ============================================================================

CREATE TABLE analytics_case_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  summary_date DATE NOT NULL,
  total_cases INTEGER NOT NULL DEFAULT 0,
  new_cases INTEGER NOT NULL DEFAULT 0,
  closed_cases INTEGER NOT NULL DEFAULT 0,
  open_cases INTEGER NOT NULL DEFAULT 0,
  escalated_cases INTEGER NOT NULL DEFAULT 0,
  avg_response_time_minutes NUMERIC,
  avg_resolution_time_minutes NUMERIC,
  avg_sla_compliance_rate NUMERIC,
  by_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_priority JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_category JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_source JSONB NOT NULL DEFAULT '{}'::jsonb,
  by_country JSONB NOT NULL DEFAULT '{}'::jsonb,
  anonymous_cases INTEGER NOT NULL DEFAULT 0,
  named_cases INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, site_id, department_id, summary_date)
);

CREATE INDEX idx_analytics_case_daily_org_date ON analytics_case_daily_summaries(organization_id, summary_date DESC);
CREATE INDEX idx_analytics_case_daily_site ON analytics_case_daily_summaries(site_id);
CREATE INDEX idx_analytics_case_daily_dept ON analytics_case_daily_summaries(department_id);

CREATE TABLE analytics_communication_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  channel TEXT NOT NULL,
  notifications_sent INTEGER NOT NULL DEFAULT 0,
  notifications_delivered INTEGER NOT NULL DEFAULT 0,
  notifications_read INTEGER NOT NULL DEFAULT 0,
  notifications_failed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, channel, summary_date)
);

CREATE INDEX idx_analytics_comm_daily_org_date ON analytics_communication_daily_summaries(organization_id, summary_date DESC);

CREATE TABLE analytics_sla_daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  sla_type TEXT NOT NULL,
  total_instances INTEGER NOT NULL DEFAULT 0,
  met_count INTEGER NOT NULL DEFAULT 0,
  breached_count INTEGER NOT NULL DEFAULT 0,
  paused_count INTEGER NOT NULL DEFAULT 0,
  avg_time_to_breach_minutes NUMERIC,
  compliance_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, sla_type, summary_date)
);

CREATE INDEX idx_analytics_sla_daily_org_date ON analytics_sla_daily_summaries(organization_id, summary_date DESC);

-- ============================================================================
-- QUEUE ARCHITECTURE
-- ============================================================================

CREATE TABLE queue_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  queue_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | queued | processing | completed | failed | cancelled | dead_letter
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX idx_queue_jobs_queue ON queue_jobs(queue_name, status);
CREATE INDEX idx_queue_jobs_org ON queue_jobs(organization_id);
