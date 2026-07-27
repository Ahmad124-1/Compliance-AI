export const SUSTAINABILITY_ENDPOINTS = {
  programs: '/api/v1/sustainability/programs',
  goals: '/api/v1/sustainability/goals',
  kpis: '/api/v1/sustainability/kpis',
  measurements: '/api/v1/sustainability/measurements',
  initiatives: '/api/v1/sustainability/initiatives',
  milestones: '/api/v1/sustainability/milestones',
  sdgs: '/api/v1/sustainability/sdgs',
  evidence: '/api/v1/sustainability/evidence',
  approvals: '/api/v1/sustainability/approvals',
  reports: '/api/v1/sustainability/reports',
  analytics: '/api/v1/sustainability/analytics',
} as const;

export const PROGRAM_CATEGORIES = [
  { value: 'net_zero', label: 'Net Zero' },
  { value: 'water', label: 'Water Stewardship' },
  { value: 'waste', label: 'Zero Waste' },
  { value: 'wellbeing', label: 'Worker Wellbeing' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'supply_chain', label: 'Responsible Sourcing' },
  { value: 'esg_transformation', label: 'ESG Transformation' },
  { value: 'general', label: 'General' },
] as const;

export const PROGRAM_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
] as const;

export const ESG_PILLARS = [
  { value: 'environment', label: 'Environmental' },
  { value: 'social', label: 'Social' },
  { value: 'governance', label: 'Governance' },
] as const;

export const GOAL_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export const KPI_TYPES = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'ratio', label: 'Ratio' },
  { value: 'currency', label: 'Currency' },
  { value: 'intensity', label: 'Intensity' },
  { value: 'count', label: 'Count' },
  { value: 'boolean', label: 'Boolean' },
] as const;

export const KPI_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const INITIATIVE_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
] as const;

export const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const EVIDENCE_TYPES = [
  { value: 'policy', label: 'Policy' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'photo', label: 'Photo' },
  { value: 'training_record', label: 'Training Record' },
  { value: 'contract', label: 'Contract' },
  { value: 'esg_evidence', label: 'ESG Evidence' },
  { value: 'other', label: 'Other' },
] as const;

export const APPROVAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
] as const;

export const REPORT_TYPES_SUSTAINABILITY = [
  { value: 'progress', label: 'Progress Report' },
  { value: 'goal_status', label: 'Goal Status Report' },
  { value: 'sdg_contribution', label: 'SDG Contribution Report' },
  { value: 'kpi_performance', label: 'KPI Performance Report' },
  { value: 'initiative_status', label: 'Initiative Status Report' },
  { value: 'executive_summary', label: 'Executive Summary' },
] as const;