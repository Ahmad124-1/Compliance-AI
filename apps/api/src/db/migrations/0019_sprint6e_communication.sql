-- 0019_sprint6e_communication.sql
-- Sprint 6E: Enterprise Communication & Collaboration Hub

-- ============================================================================
-- MESSAGES (unified messages across channels)
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'direct', -- direct | group | broadcast | system | emergency
  category TEXT NOT NULL DEFAULT 'general', -- company | department | factory | hr | compliance | training | audit | emergency
  priority TEXT NOT NULL DEFAULT 'normal', -- low | normal | high | critical | emergency
  subject TEXT,
  body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app', -- in_app | email | sms | whatsapp | push | voice
  channels TEXT[] DEFAULT '{in_app}',
  locale TEXT NOT NULL DEFAULT 'en',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_priority ON messages(priority);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- CONVERSATIONS (chat threads)
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'direct', -- direct | group | channel | support
  category TEXT, -- hr | compliance | safety | general | audit | training
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_type ON conversations(type);

-- ============================================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================================
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner | admin | member | viewer
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_muted BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);

-- ============================================================================
-- BROADCASTS (company/department/factory broadcasts)
-- ============================================================================
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  broadcast_type TEXT NOT NULL DEFAULT 'company', -- company | department | factory | emergency | hr | compliance | training | audit
  priority TEXT NOT NULL DEFAULT 'normal', -- low | normal | high | critical | emergency
  scope JSONB NOT NULL DEFAULT '{}'::jsonb, -- { siteIds, departmentIds, teamIds, userIds }
  channels TEXT[] DEFAULT '{in_app}', -- in_app | email | sms | whatsapp | push
  locale TEXT NOT NULL DEFAULT 'en',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  acknowledgement_required BOOLEAN NOT NULL DEFAULT FALSE,
  read_tracking BOOLEAN NOT NULL DEFAULT TRUE,
  expiry_date TIMESTAMPTZ,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcasts_org ON broadcasts(organization_id);
CREATE INDEX idx_broadcasts_type ON broadcasts(broadcast_type);
CREATE INDEX idx_broadcasts_priority ON broadcasts(priority);
CREATE INDEX idx_broadcasts_scheduled ON broadcasts(scheduled_at);

-- ============================================================================
-- BROADCAST RECIPIENTS (acknowledgements, reads)
-- ============================================================================
CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | delivered | read | acknowledged | failed
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_status ON broadcast_recipients(status);

-- ============================================================================
-- EMERGENCY ALERTS
-- ============================================================================
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- fire | medical | chemical_spill | earthquake | evacuation | weather | security
  priority TEXT NOT NULL DEFAULT 'critical',
  severity TEXT NOT NULL DEFAULT 'high', -- low | medium | high | critical
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels TEXT[] DEFAULT '{in_app,push,sms}',
  instructions TEXT,
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT TRUE,
  escalation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  escalation_after_minutes INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  acknowledged_count INTEGER NOT NULL DEFAULT 0,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_alerts_org ON emergency_alerts(organization_id);
CREATE INDEX idx_emergency_alerts_type ON emergency_alerts(alert_type);
CREATE INDEX idx_emergency_alerts_active ON emergency_alerts(is_active);

-- ============================================================================
-- EMERGENCY ACKNOWLEDGEMENTS
-- ============================================================================
CREATE TABLE emergency_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'acknowledged', -- acknowledged | safe | help_needed | escalated
  note TEXT,
  location JSONB,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emergency_ack_alert ON emergency_acknowledgements(emergency_alert_id);
CREATE INDEX idx_emergency_ack_user ON emergency_acknowledgements(user_id);

-- ============================================================================
-- CALENDAR EVENTS
-- ============================================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting', -- company_event | training | audit | meeting | safety_drill | compliance_deadline
  priority TEXT NOT NULL DEFAULT 'normal',
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  recurrence_rule TEXT,
  scope JSONB NOT NULL DEFAULT '{}'::jsonb, -- { siteIds, departmentIds, userIds }
  reminder_minutes INTEGER[] DEFAULT '{15,60}',
  channels TEXT[] DEFAULT '{in_app}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_org ON calendar_events(organization_id);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_start ON calendar_events(start_at);

-- ============================================================================
-- EVENT ATTENDEES
-- ============================================================================
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited', -- invited | accepted | declined | tentative
  response_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(calendar_event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);

-- ============================================================================
-- CHANNEL CONFIGS (channel manager preferences and routing rules)
-- ============================================================================
CREATE TABLE channel_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- in_app | email | sms | whatsapp | push
  priority INTEGER NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, channel)
);

CREATE INDEX idx_channel_configs_org_user ON channel_configs(organization_id, user_id);

-- ============================================================================
-- MESSAGE ATTACHMENTS
-- ============================================================================
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
