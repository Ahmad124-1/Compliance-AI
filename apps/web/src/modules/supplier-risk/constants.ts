export const SUPPLIER_RISK_ENDPOINTS = {
  risks: '/api/v1/suppliers/risks',
  risk: (id: string) => `/api/v1/suppliers/risks/${id}`,
  riskHeatmap: '/api/v1/suppliers/risks/heatmap',
  closeRisk: (id: string) => `/api/v1/suppliers/risks/${id}/close`,
} as const;

export const RISK_TYPES = [
  { value: 'child_labour', label: 'Child Labour' },
  { value: 'forced_labour', label: 'Forced Labour' },
  { value: 'modern_slavery', label: 'Modern Slavery' },
  { value: 'unsafe_working_conditions', label: 'Unsafe Working Conditions' },
  { value: 'environmental_violation', label: 'Environmental Violation' },
  { value: 'corruption', label: 'Corruption' },
  { value: 'sanctions', label: 'Sanctions' },
  { value: 'conflict_minerals', label: 'Conflict Minerals' },
  { value: 'illegal_waste_disposal', label: 'Illegal Waste Disposal' },
  { value: 'deforestation', label: 'Deforestation' },
  { value: 'country_risk', label: 'Country Risk' },
  { value: 'political_risk', label: 'Political Risk' },
  { value: 'climate_risk', label: 'Climate Risk' },
] as const;

export const LIKELIHOOD_OPTIONS = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
] as const;

export const IMPACT_OPTIONS = [
  { value: 'negligible', label: 'Negligible' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'major', label: 'Major' },
  { value: 'severe', label: 'Severe' },
] as const;

export const RISK_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'mitigated', label: 'Mitigated' },
  { value: 'closed', label: 'Closed' },
  { value: 'escalated', label: 'Escalated' },
] as const;