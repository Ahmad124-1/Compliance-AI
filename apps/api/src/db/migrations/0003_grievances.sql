-- 0003_grievances.sql
-- Worker Voice & Grievance Platform core tables.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Core grievance record.
CREATE TABLE grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL UNIQUE,
  tracking_pin TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website', -- website | qr | email | sms | whatsapp | phone | walk-in | suggestion_box | ngo | union | government
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | under_review | escalated | resolved | closed
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  anonymous BOOLEAN NOT NULL DEFAULT TRUE,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  factory TEXT,
  department TEXT,
  location TEXT,
  severity TEXT, -- low | medium | high | critical
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grievances_org ON grievances(organization_id);
CREATE INDEX idx_grievances_tracking ON grievances(tracking_number);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_created ON grievances(created_at);

-- Attachments linked to a grievance.
CREATE TABLE grievance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grievance_attachments_grievance ON grievance_attachments(grievance_id);
