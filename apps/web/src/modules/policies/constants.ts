export const POLICY_ENDPOINTS = {
  list: '/api/v1/ai/policies',
  get: (id: string) => `/api/v1/ai/policies/${id}`,
  generate: '/api/v1/ai/policies/generate',
  update: (id: string) => `/api/v1/ai/policies/${id}`,
  approve: (id: string) => `/api/v1/ai/policies/${id}/approve`,
  reject: (id: string) => `/api/v1/ai/policies/${id}/reject`,
  export: (id: string) => `/api/v1/ai/policies/${id}/export`,
} as const;

export const POLICY_TYPES = [
  { value: 'environmental', label: 'Environmental Policy' },
  { value: 'esg', label: 'ESG Policy' },
  { value: 'sustainability', label: 'Sustainability Policy' },
  { value: 'health_safety', label: 'Health & Safety Policy' },
  { value: 'quality', label: 'Quality Policy' },
  { value: 'data_privacy', label: 'Data Privacy Policy' },
  { value: 'code_of_conduct', label: 'Code of Conduct' },
  { value: 'anti_bribery', label: 'Anti-Bribery & Corruption' },
  { value: 'whistleblower', label: 'Whistleblower Policy' },
  { value: 'custom', label: 'Custom Policy' },
] as const;

