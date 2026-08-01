export const DOCUMENT_ENDPOINTS = {
  list: '/api/v1/ai/documents',
  get: (id: string) => `/api/v1/ai/documents/${id}`,
  upload: '/api/v1/ai/documents',
  process: (id: string) => `/api/v1/ai/documents/${id}/process`,
  analyze: (id: string) => `/api/v1/ai/documents/${id}/analyze`,
} as const;

export const DOCUMENT_ACTIONS = [
  { value: 'summarize', label: 'Summarize' },
  { value: 'explain', label: 'Explain' },
  { value: 'detect_gaps', label: 'Detect Compliance Gaps' },
  { value: 'highlight_risks', label: 'Highlight Risks' },
  { value: 'compare_standards', label: 'Compare Standards' },
  { value: 'suggest_improvements', label: 'Suggest Improvements' },
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'extract_findings', label: 'Extract Findings' },
] as const;

