export type RiskType = 'child_labour' | 'forced_labour' | 'modern_slavery' | 'unsafe_working_conditions' | 'environmental_violation' | 'corruption' | 'sanctions' | 'conflict_minerals' | 'illegal_waste_disposal' | 'deforestation' | 'country_risk' | 'political_risk' | 'climate_risk';
export type Likelihood = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type Impact = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
export type RiskStatus = 'open' | 'in_progress' | 'mitigated' | 'closed' | 'escalated';

export interface RiskRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  riskType: RiskType;
  title: string;
  description: string | null;
  likelihood: Likelihood;
  impact: Impact;
  riskScore: number;
  mitigationPlan: string | null;
  ownerId: string | null;
  ownerName: string | null;
  reviewSchedule: string | null;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RiskHeatmapData {
  likelihood: number;
  impact: number;
  count: number;
  riskTypes: RiskType[];
}

export interface RiskAssessmentSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  riskType: RiskType;
  likelihood: Likelihood;
  impact: Impact;
  riskScore: number;
  status: RiskStatus;
  ownerName: string | null;
  reviewSchedule: string | null;
  createdAt: string;
}