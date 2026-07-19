export const AI_ENDPOINTS = {
  capabilities: '/api/v1/ai/capabilities',
  analyze: '/api/v1/ai/analyze',
  translate: '/api/v1/ai/translate',
} as const;

export const AI_PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  azure: 'Azure AI',
  local: 'Local Model',
  null: 'Disabled',
};

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
