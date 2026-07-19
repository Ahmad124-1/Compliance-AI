export const REPORT_ENDPOINTS = {
  templates: '/api/v1/reports/templates',
  generate: '/api/v1/reports/generate',
  download: (id: string) => `/api/v1/reports/${id}/download`,
} as const;

export const REPORT_TYPES = [
  { value: 'audit', label: 'Audit Report' },
  { value: 'assessment', label: 'Assessment Report' },
  { value: 'finding', label: 'Finding Report' },
  { value: 'capa', label: 'CAPA Report' },
  { value: 'worker_voice', label: 'Worker Voice Report' },
  { value: 'executive', label: 'Executive Summary' },
  { value: 'compliance', label: 'Compliance Report' },
  { value: 'organization', label: 'Organization Report' },
  { value: 'factory', label: 'Factory Report' },
  { value: 'supplier', label: 'Supplier Report' },
  { value: 'department', label: 'Department Report' },
  { value: 'custom', label: 'Custom Report' },
] as const;

export const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'print', label: 'Print View' },
] as const;
