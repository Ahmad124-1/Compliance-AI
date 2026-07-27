-- 0017_worker_ai.sql
-- AI Worker Assistant (Sprint 6C).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversation metadata tracking.
CREATE TABLE worker_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  language TEXT NOT NULL DEFAULT 'en',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_ai_conversations_org ON worker_ai_conversations(organization_id);
CREATE INDEX idx_worker_ai_conversations_user ON worker_ai_conversations(user_id);

-- Document submissions for the document assistant.
CREATE TABLE worker_ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  summary TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_worker_ai_documents_org_user ON worker_ai_documents(organization_id, user_id);
