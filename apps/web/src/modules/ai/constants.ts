export const AI_ENDPOINTS = {
  capabilities: '/api/v1/ai/capabilities',
  providers: '/api/v1/ai/providers',
  config: '/api/v1/ai/config',
  updateConfig: '/api/v1/ai/config',
  prompts: '/api/v1/ai/prompts',
  createPrompt: '/api/v1/ai/prompts',
  renderPrompt: '/api/v1/ai/prompts/render',
  knowledgeStandards: '/api/v1/ai/knowledge/standards',
  ingest: '/api/v1/ai/knowledge/ingest',
  vectorSearch: '/api/v1/ai/vector/search',
  indexKb: '/api/v1/ai/vector/index/kb',
  indexKbJob: '/api/v1/ai/jobs/index-kb',
  rag: '/api/v1/ai/rag',
  ragContext: '/api/v1/ai/rag/context',
  chat: '/api/v1/ai/chat',
  chatStream: '/api/v1/ai/chat/stream',
  memoryScope: (scope: string) => `/api/v1/ai/memory/${scope}`,
  memory: '/api/v1/ai/memory',
  jobs: '/api/v1/ai/jobs',
  jobStats: '/api/v1/ai/jobs/stats',
  usage: '/api/v1/ai/usage',
} as const;

export const AI_PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google Gemini',
  azure: 'Azure OpenAI',
  ollama: 'Ollama (Local)',
  null: 'Disabled',
};

export const AI_EMBEDDING_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  ollama: 'Ollama (Local)',
  null: 'Disabled',
};

export const KNOWLEDGE_DOMAINS: Array<{ code: string; label: string }> = [
  { code: 'policy', label: 'Policy' },
  { code: 'audit', label: 'Audit' },
  { code: 'capa', label: 'CAPA' },
  { code: 'grievance', label: 'Worker Grievance' },
  { code: 'evidence', label: 'Evidence' },
  { code: 'supplier', label: 'Supplier' },
];

export const KNOWLEDGE_CATEGORIES: Array<{ code: string; label: string }> = [
  { code: 'social', label: 'Social' },
  { code: 'quality', label: 'Quality' },
  { code: 'environment', label: 'Environment' },
  { code: 'energy', label: 'Energy' },
  { code: 'esg', label: 'ESG' },
  { code: 'legal', label: 'Legal' },
  { code: 'custom', label: 'Custom' },
];

export const SUPPORTED_LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese' },
  { code: 'bn', label: 'Bengali' },
  { code: 'id', label: 'Indonesian' },
  { code: 'tr', label: 'Turkish' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  wages: 'Wages & Compensation',
  safety: 'Safety',
  harassment: 'Harassment',
  discrimination: 'Discrimination',
  working_hours: 'Working Hours',
  forced_labor: 'Forced Labor',
  child_labor: 'Child Labor',
  freedom_of_association: 'Freedom of Association',
  health: 'Health',
  environment: 'Environment',
  corruption: 'Corruption',
  other: 'Other',
};
