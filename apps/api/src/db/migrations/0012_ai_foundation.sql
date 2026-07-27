-- 0012_ai_foundation.sql
-- AI Foundation & Compliance Knowledge Engine (Sprint 5A)
--
-- Introduces the complete AI infrastructure:
--   * ai_config            — per-organization admin configuration (provider, model, temperature, prompts)
--   * ai_prompt_templates — versioned prompt templates
--   * knowledge_standards  — compliance knowledge base (standards + clauses)
--   * knowledge_entries    — indexed knowledge documents (chunks)
--   * ai_embeddings        — pgvector embeddings for semantic search
--   * ai_memory            — conversation / organisation / supplier / audit memory
--   * ai_jobs              — background AI job queue
--   * ai_token_ledger      — token accounting + cost tracking
--   * ai_cache             — response cache
--
-- Requires the `vector` extension (pgvector).

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- AI configuration (admin settings, per organization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_config (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'null',                 -- openai | anthropic | gemini | azure | ollama | null
  embedding_provider TEXT NOT NULL DEFAULT 'null',        -- openai | azure | ollama | null
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  temperature NUMERIC NOT NULL DEFAULT 0.2 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INT NOT NULL DEFAULT 2048 CHECK (max_tokens > 0 AND max_tokens <= 32000),
  top_p NUMERIC NOT NULL DEFAULT 1 CHECK (top_p >= 0 AND top_p <= 1),
  fallback_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  fallback_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  rate_limit_rpm INT NOT NULL DEFAULT 60 CHECK (rate_limit_rpm > 0),
  rate_limit_tpm INT NOT NULL DEFAULT 90000 CHECK (rate_limit_tpm > 0),
  cache_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  cache_ttl_seconds INT NOT NULL DEFAULT 86400 CHECK (cache_ttl_seconds >= 0),
  streaming_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rag_top_k INT NOT NULL DEFAULT 6 CHECK (rag_top_k >= 0 AND rag_top_k <= 50),
  rag_min_score NUMERIC NOT NULL DEFAULT 0.2 CHECK (rag_min_score >= 0 AND rag_min_score <= 1),
  system_prompt TEXT,
  enable_audit BOOLEAN NOT NULL DEFAULT TRUE,
  enable_supplier BOOLEAN NOT NULL DEFAULT TRUE,
  enable_capa BOOLEAN NOT NULL DEFAULT TRUE,
  enable_grievance BOOLEAN NOT NULL DEFAULT TRUE,
  enable_evidence BOOLEAN NOT NULL DEFAULT TRUE,
  enable_policy BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Prompt templates (versioned, admin-managed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,                                       -- e.g. 'rag.answer', 'capa.draft'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',                -- rag | analysis | generation | translation | classify
  version INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,                                   -- mustache-style template
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,            -- declared variable names
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, key, version)
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_org ON ai_prompt_templates(organization_id, key);

-- ---------------------------------------------------------------------------
-- Compliance Knowledge Base
--   knowledge_standards — top-level standard (SA8000, ISO9001, ...)
--   knowledge_clauses   — clauses / requirements of a standard
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,   -- NULL = platform/global KB
  code TEXT NOT NULL,                                       -- 'SA8000', 'ISO9001', 'ILO_C029'
  name TEXT NOT NULL,
  publisher TEXT,                                            -- 'SAI', 'ISO', 'ILO', 'Local'
  category TEXT NOT NULL DEFAULT 'social',                   -- social | quality | environment | energy | esg | legal | custom
  jurisdiction TEXT,                                          -- e.g. 'Global', 'EU', 'Bangladesh'
  description TEXT,
  version TEXT,
  source_url TEXT,
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS knowledge_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_id UUID NOT NULL REFERENCES knowledge_standards(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES knowledge_clauses(id) ON DELETE CASCADE,
  code TEXT,                                                 -- 'A1', '4.2'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_standards_code ON knowledge_standards(code);
CREATE INDEX IF NOT EXISTS idx_knowledge_standards_org ON knowledge_standards(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_clauses_standard ON knowledge_clauses(standard_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_clauses_parent ON knowledge_clauses(parent_id);

-- ---------------------------------------------------------------------------
-- Knowledge entries (chunked, indexed documents for retrieval)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  standard_id UUID REFERENCES knowledge_standards(id) ON DELETE SET NULL,
  clause_id UUID REFERENCES knowledge_clauses(id) ON DELETE SET NULL,
  domain TEXT NOT NULL DEFAULT 'policy',                     -- policy | audit | capa | grievance | evidence | supplier
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  chunk_index INT NOT NULL DEFAULT 0,
  chunk_count INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entries_org ON knowledge_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_standard ON knowledge_entries(standard_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_domain ON knowledge_entries(domain);

-- ---------------------------------------------------------------------------
-- Vector embeddings (pgvector) — one row per embeddable chunk
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,                                  -- knowledge_entry | policy | audit | capa | grievance | evidence | supplier
  source_id UUID NOT NULL,
  domain TEXT NOT NULL DEFAULT 'policy',                      -- mirrors knowledge_entries.domain / entity domain
  model TEXT NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(1536),                                    -- OpenAI text-embedding-3-small dimensionality
  tokens INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_source ON ai_embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_org ON ai_embeddings(organization_id);
-- Cosine similarity index for fast ANN search.
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_vec ON ai_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- AI Memory (conversation / organisation / supplier / audit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,                                        -- conversation | organization | supplier | audit
  scope_id UUID,                                              -- conversation id / supplier id / audit id (NULL for organization scope)
  role TEXT NOT NULL,                                         -- system | user | assistant | note
  content TEXT NOT NULL,
  tokens INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_org_scope ON ai_memory(organization_id, scope);
CREATE INDEX IF NOT EXISTS idx_ai_memory_scope_id ON ai_memory(scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_conversation ON ai_memory(scope_id) WHERE scope = 'conversation';

-- ---------------------------------------------------------------------------
-- Background AI job queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                                         -- embed | summarize | analyze | generate | rag | translate
  status TEXT NOT NULL DEFAULT 'queued',                      -- queued | running | completed | failed | retrying | cancelled
  priority INT NOT NULL DEFAULT 5,                            -- 1 (highest) .. 10 (lowest)
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  progress INT NOT NULL DEFAULT 0,
  provider TEXT,
  model TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_org ON ai_jobs(organization_id);

-- ---------------------------------------------------------------------------
-- Token accounting + cost tracking ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES ai_jobs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'completion',                    -- completion | embedding
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  cost_usd NUMERIC NOT NULL DEFAULT 0,                        -- computed USD cost
  cached BOOLEAN NOT NULL DEFAULT FALSE,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_org ON ai_token_ledger(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_ledger_created ON ai_token_ledger(created_at);

-- ---------------------------------------------------------------------------
-- AI response cache (keyed by content hash + model)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,                                    -- sha256(model + normalized prompt)
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  response JSONB NOT NULL,
  prompt_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
