export const ASSESSMENT_ENDPOINTS = {
  dashboard: '/api/v1/assessments/dashboard',
  answerTypes: '/api/v1/assessments/catalogue/answer-types',
  types: '/api/v1/assessments/catalogue/types',
  categories: '/api/v1/assessments/catalogue/categories',
  tags: '/api/v1/assessments/catalogue/tags',
  templates: '/api/v1/assessments/templates',
  templateStructure: (id: string) => `/api/v1/assessments/templates/${id}/structure`,
  templateVersions: (id: string) => `/api/v1/assessments/templates/${id}/versions`,
  sections: (id: string) => `/api/v1/assessments/templates/${id}/sections`,
  questions: (id: string) => `/api/v1/assessments/templates/${id}/questions`,
  conditions: (id: string) => `/api/v1/assessments/templates/${id}/conditions`,
  dependencies: (id: string) => `/api/v1/assessments/templates/${id}/dependencies`,
  scoringRules: (id: string) => `/api/v1/assessments/templates/${id}/scoring-rules`,
  validationRules: (id: string) => `/api/v1/assessments/templates/${id}/validation-rules`,
  frameworkMappings: (id: string) => `/api/v1/assessments/templates/${id}/framework-mappings`,
  controlMappings: (id: string) => `/api/v1/assessments/templates/${id}/control-mappings`,
  library: '/api/v1/assessments/library',
  search: '/api/v1/assessments/search',
  assessments: '/api/v1/assessments',
  assignment: (id: string) => `/api/v1/assessments/${id}`,
  schedulePlaceholders: '/api/v1/assessments/schedule-placeholders',
} as const;

export const ASSESSMENT_ROUTES = {
  dashboard: '/assessments',
  templates: '/assessments/templates',
  templateBuilder: (id = ':id') => `/assessments/templates/${id}`,
  library: '/assessments/library',
  assessmentDetail: (id = ':id') => `/assessments/${id}`,
} as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', published: 'Published', archived: 'Archived',
  in_progress: 'In Progress', submitted: 'Submitted', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', completed: 'Completed',
  cancelled: 'Cancelled', active: 'Active',
};

export const ASSESSMENT_PERMISSIONS = {
  read: 'assessment:read',
  create: 'assessment:create',
  update: 'assessment:update',
  delete: 'assessment:delete',
};
