export type SupplierRiskType = 'child_labour' | 'forced_labour' | 'modern_slavery' | 'unsafe_working_conditions' | 'environmental_violation' | 'corruption' | 'sanctions' | 'conflict_minerals' | 'illegal_waste_disposal' | 'deforestation' | 'country_risk' | 'political_risk' | 'climate_risk';
export type SupplierLikelihood = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
export type SupplierImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
export type SupplierRiskStatus = 'open' | 'in_progress' | 'mitigated' | 'closed' | 'escalated';

export interface SupplierRiskRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  riskType: SupplierRiskType;
  title: string;
  description: string | null;
  likelihood: SupplierLikelihood;
  impact: SupplierImpact;
  riskScore: number;
  mitigationPlan: string | null;
  ownerId: string | null;
  ownerName: string | null;
  reviewSchedule: string | null;
  status: SupplierRiskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRiskHeatmapData {
  likelihood: number;
  impact: number;
  count: number;
  riskTypes: SupplierRiskType[];
}

export interface SupplierRiskAssessmentSummary {
  id: string;
  supplierId: string;
  supplierName: string;
  riskType: SupplierRiskType;
  likelihood: SupplierLikelihood;
  impact: SupplierImpact;
  riskScore: number;
  status: SupplierRiskStatus;
  ownerName: string | null;
  reviewSchedule: string | null;
  createdAt: string;
}