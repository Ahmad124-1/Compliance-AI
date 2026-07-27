export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted';
export type SupplierRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SupplierCategory = 'raw_material' | 'component' | 'service' | 'logistics' | 'consulting' | 'manufacturing' | 'other';
export type SupplierIndustry = 'electronics' | 'textile' | 'food' | 'chemical' | 'construction' | 'automotive' | 'pharmaceutical' | 'technology' | 'energy' | 'retail' | 'other';

export interface SupplierRecord {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  category: SupplierCategory | null;
  industry: SupplierIndustry | null;
  country: string | null;
  region: string | null;
  city: string | null;
  address: Record<string, unknown> | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  businessUnit: string | null;
  status: SupplierStatus;
  riskLevel: SupplierRiskLevel;
  esgScore: number;
  carbonScore: number;
  complianceRate: number;
  totalAssessments: number;
  activeAudits: number;
  openCorrectiveActions: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFacilityRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  name: string;
  facilityType: 'factory' | 'warehouse' | 'production_site' | 'office' | 'distribution_center' | 'other';
  address: Record<string, unknown> | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierAssessmentRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  title: string;
  description: string | null;
  category: 'environmental' | 'social' | 'governance' | 'health_safety' | 'ethics' | 'responsible_sourcing' | 'labor_rights' | 'human_rights' | 'anti_corruption' | 'data_privacy';
  questions: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
  scoring: Record<string, unknown>;
  overallScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  healthSafetyScore: number;
  status: 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  reviewerId: string | null;
  reviewerName: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'requested_changes';
  approvedById: string | null;
  approvedAt: string | null;
  dueDate: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierScorecardRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  overallEsgScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  complianceScore: number;
  carbonScore: number;
  riskScore: number;
  benchmarkComparison: Record<string, unknown>;
  trendAnalysis: Record<string, unknown>[];
  historicalPerformance: Record<string, unknown>[];
  assessmentPeriod: string | null;
  scoringDate: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRiskRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  riskType: 'child_labour' | 'forced_labour' | 'modern_slavery' | 'unsafe_working_conditions' | 'environmental_violation' | 'corruption' | 'sanctions' | 'conflict_minerals' | 'illegal_waste_disposal' | 'deforestation' | 'country_risk' | 'political_risk' | 'climate_risk';
  title: string;
  description: string | null;
  likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
  riskScore: number;
  mitigationPlan: string | null;
  ownerId: string | null;
  ownerName: string | null;
  reviewSchedule: string | null;
  status: 'open' | 'in_progress' | 'mitigated' | 'closed' | 'escalated';
  createdAt: string;
  updatedAt: string;
}

export interface SupplierAuditRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  title: string;
  description: string | null;
  auditType: 'desktop' | 'remote' | 'onsite' | 'third_party' | 'follow_up';
  status: 'planned' | 'in_progress' | 'completed' | 'follow_up_required' | 'cancelled';
  findings: Record<string, unknown>[];
  evidence: Record<string, unknown>[];
  photos: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  capas: Record<string, unknown>[];
  approvals: Record<string, unknown>[];
  auditorId: string | null;
  auditorName: string | null;
  auditDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCertificationRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  certificationName: string;
  certificationType: 'iso_14001' | 'iso_45001' | 'iso_9001' | 'sa8000' | 'smeta' | 'bsci' | 'wrap' | 'fsc' | 'fairtrade' | 'rainforest_alliance' | 'organic' | 'custom';
  certificationBody: string | null;
  certificateNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  renewalDate: string | null;
  status: 'active' | 'expired' | 'pending_renewal' | 'revoked' | 'suspended';
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  evidence: Record<string, unknown>[];
  scope: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResponsibleMaterialRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  materialName: string;
  materialCategory: 'raw_material' | 'conflict_mineral' | 'palm_oil' | 'cotton' | 'timber' | 'recycled_material' | 'mineral' | 'chemical' | 'component' | 'other';
  countryOfOrigin: string | null;
  traceabilityId: string | null;
  supplyChainMapping: Record<string, unknown>[];
  certifyingBody: string | null;
  certificationStatus: string | null;
  chainOfCustody: string | null;
  quantity: number | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyChainNodeRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  nodeName: string;
  nodeType: 'supplier' | 'sub_supplier' | 'factory' | 'warehouse' | 'production_site' | 'distributor' | 'retailer';
  parentNodeId: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  address: Record<string, unknown> | null;
  relationshipType: 'direct' | 'tier_2' | 'tier_3' | 'tier_n';
  productsServices: Record<string, unknown>[];
  capacity: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCarbonRecordRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  category: string | null;
  emissionValue: number | null;
  unit: string;
  energyConsumption: number | null;
  energyUnit: string;
  renewableEnergy: boolean;
  renewablePercentage: number;
  wasteGenerated: number | null;
  wasteUnit: string;
  waterConsumption: number | null;
  waterUnit: string;
  reductionProject: string | null;
  targetValue: number | null;
  targetYear: number | null;
  baselineValue: number | null;
  emissionDate: string | null;
  reportingPeriod: string | null;
  source: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}