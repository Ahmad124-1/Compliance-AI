export const SUPPLIER_ESG_ENDPOINTS = {
  assessments: '/api/v1/suppliers/assessments',
  assessment: (id: string) => `/api/v1/suppliers/assessments/${id}`,
  assessmentSubmit: (id: string) => `/api/v1/suppliers/assessments/${id}/submit`,
  assessmentReview: (id: string) => `/api/v1/suppliers/assessments/${id}/review`,
  assessmentSummary: (supplierId: string) => `/api/v1/suppliers/${supplierId}/assessments/summary`,
} as const;

export const ASSESSMENT_CATEGORIES = [
  { value: 'environmental', label: 'Environmental' },
  { value: 'social', label: 'Social' },
  { value: 'governance', label: 'Governance' },
  { value: 'health_safety', label: 'Health & Safety' },
  { value: 'ethics', label: 'Ethics' },
  { value: 'responsible_sourcing', label: 'Responsible Sourcing' },
  { value: 'labor_rights', label: 'Labor Rights' },
  { value: 'human_rights', label: 'Human Rights' },
  { value: 'anti_corruption', label: 'Anti-Corruption' },
  { value: 'data_privacy', label: 'Data Privacy' },
] as const;

export const ASSESSMENT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'completed', label: 'Completed' },
] as const;