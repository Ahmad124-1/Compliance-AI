export const ESG_ENDPOINTS = {
  frameworks: '/api/v1/esg/frameworks',
  frameworkMetrics: (frameworkId: string) => `/api/v1/esg/frameworks/${frameworkId}/metrics`,
  metrics: '/api/v1/esg/metrics',
  periods: '/api/v1/esg/periods',
  periodAssessments: (periodId: string) => `/api/v1/esg/periods/${periodId}/assessments`,
  dataPoints: '/api/v1/esg/data-points',
  materialityTopics: '/api/v1/esg/materiality/topics',
  materialityAssessments: '/api/v1/esg/materiality/assessments',
  disclosures: '/api/v1/esg/disclosures',
  reports: '/api/v1/esg/reports',
  assurance: '/api/v1/esg/assurance',
};

export const FRAMEWORK_CODES = [
  { value: 'gri', label: 'GRI (Global Reporting Initiative)' },
  { value: 'sasb', label: 'SASB (Sustainability Accounting Standards Board)' },
  { value: 'tcfd', label: 'TCFD (Task Force on Climate-related Financial Disclosures)' },
  { value: 'csrd', label: 'CSRD (Corporate Sustainability Reporting Directive)' },
  { value: 'cdp', label: 'CDP (Carbon Disclosure Project)' },
  { value: 'djsi', label: 'DJSI (Dow Jones Sustainability Index)' },
  { value: 'mSCI', label: 'MSCI ESG Ratings' },
  { value: 'custom', label: 'Custom Framework' },
] as const;

export const PILLARS = [
  { value: 'environmental', label: 'Environmental' },
  { value: 'social', label: 'Social' },
  { value: 'governance', label: 'Governance' },
] as const;

export const METRIC_DATA_TYPES = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'currency', label: 'Currency' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'json', label: 'JSON' },
] as const;

export const METRIC_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'event_based', label: 'Event-Based' },
  { value: 'continuous', label: 'Continuous' },
] as const;

export const PERIOD_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'custom', label: 'Custom' },
] as const;

export const PERIOD_STATUSES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'extended', label: 'Extended' },
  { value: 'finalized', label: 'Finalized' },
] as const;

export const DISCLOSURE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const;

export const ASSURANCE_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
] as const;

export const ASSURANCE_TYPES = [
  { value: 'internal', label: 'Internal Audit' },
  { value: 'external', label: 'External Audit' },
  { value: 'limited', label: 'Limited Assurance' },
  { value: 'reasonable', label: 'Reasonable Assurance' },
  { value: 'peer_review', label: 'Peer Review' },
  { value: 'third_party', label: 'Third-Party Review' },
] as const;

export const ASSURANCE_OPINIONS = [
  { value: 'clean', label: 'Clean Opinion' },
  { value: 'qualified', label: 'Qualified Opinion' },
  { value: 'adverse', label: 'Adverse Opinion' },
  { value: 'disclaimer', label: 'Disclaimer' },
  { value: 'not_applicable', label: 'Not Applicable' },
] as const;

export const REPORT_TYPES = [
  { value: 'comprehensive', label: 'Comprehensive ESG Report' },
  { value: 'sustainability', label: 'Sustainability Report' },
  { value: 'climate', label: 'Climate Report' },
  { value: 'social', label: 'Social Report' },
  { value: 'governance', label: 'Governance Report' },
  { value: 'regulatory_filing', label: 'Regulatory Filing' },
  { value: 'executive_summary', label: 'Executive Summary' },
  { value: 'stakeholder', label: 'Stakeholder Report' },
  { value: 'custom', label: 'Custom Report' },
] as const;

export const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'docx', label: 'Word' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
] as const;

export const REPORT_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'generating', label: 'Generating' },
  { value: 'completed', label: 'Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
  { value: 'failed', label: 'Failed' },
] as const;

export const FINANCIAL_IMPACTS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'negligible', label: 'Negligible' },
] as const;
