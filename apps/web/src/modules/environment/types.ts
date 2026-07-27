export type WaterSourceType = 'ground_water' | 'municipal' | 'rainwater' | 'recycled' | 'surface_water' | 'other';
export type WasteType = 'general' | 'hazardous' | 'electronic' | 'plastic' | 'paper' | 'organic' | 'metal' | 'chemical' | 'medical' | 'construction' | 'other';
export type AirEmissionType = 'stack' | 'boiler' | 'generator' | 'dust' | 'voc' | 'nox' | 'sox' | 'pm25' | 'pm10' | 'co' | 'co2' | 'methane' | 'other';
export type MonitoringFrequency = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'other';
export type HazardClassification = 'flammable' | 'toxic' | 'corrosive' | 'explosive' | 'reactive' | 'environmental' | 'carcinogen' | 'mutagen' | 'oxidizer' | 'irritant' | 'other';
export type RiskRating = 'low' | 'medium' | 'high' | 'extreme';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type IncidentType = 'chemical_spill' | 'water_leak' | 'oil_spill' | 'air_pollution' | 'illegal_disposal' | 'hazardous_release' | 'permit_violation' | 'environmental_complaint' | 'noise_pollution' | 'soil_contamination' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'contained' | 'resolved' | 'closed' | 'escalated';
export type InvestigationStatus = 'pending' | 'in_progress' | 'completed' | 'not_required';
export type LikelihoodLevel = 'rare' | 'unlikely' | 'possible' | 'likely' | 'almost_certain';
export type SeverityLevel = 'negligible' | 'minor' | 'moderate' | 'major' | 'severe';
export type RiskStatus = 'active' | 'mitigated' | 'closed' | 'accepted';
export type ReviewSchedule = 'monthly' | 'quarterly' | 'bi_annual' | 'annual' | 'as_needed';
export type PermitType = 'water' | 'air' | 'waste' | 'chemical' | 'environmental_approval' | 'discharge' | 'emission' | 'storage' | 'transport' | 'other';
export type PermitStatus = 'active' | 'expired' | 'pending' | 'revoked' | 'suspended' | 'renewed';
export type ResourceType = 'electricity' | 'gas' | 'fuel' | 'steam' | 'compressed_air' | 'water' | 'other';
export type EnvironmentalProjectType = 'protected_area' | 'tree_plantation' | 'green_area' | 'wildlife' | 'habitat_protection' | 'restoration' | 'environmental_initiative' | 'other';
export type ProjectStatus = 'planning' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export interface WaterUsage {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  departmentId: string | null;
  sourceType: WaterSourceType;
  consumptionDate: string;
  consumptionAmount: number;
  unit: string;
  dischargeAmount: number | null;
  dischargeQuality: string | null;
  treatmentMethod: string | null;
  reuseAmount: number;
  leakDetected: boolean;
  leakDetails: string | null;
  waterIntensity: number | null;
  cost: number | null;
  recordedBy: string | null;
  isVerified: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WasteRecord {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  departmentId: string | null;
  wasteType: WasteType;
  quantity: number;
  unit: string;
  weight: number | null;
  disposalMethod: string;
  recyclerId: string | null;
  vendorId: string | null;
  manifestNumber: string | null;
  certificateUrl: string | null;
  hazardousDetails: string | null;
  wasteDate: string;
  cost: number | null;
  recordedBy: string | null;
  isVerified: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AirEmission {
  id: string;
  organizationId: string;
  facilityId: string | null;
  emissionSourceId: string | null;
  emissionType: AirEmissionType;
  quantity: number;
  unit: string;
  monitoringFrequency: string | null;
  emissionLimit: number | null;
  concentration: number | null;
  emissionDate: string;
  reportingPeriod: string;
  recordedBy: string | null;
  isVerified: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chemical {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  chemicalName: string;
  casNumber: string | null;
  formula: string | null;
  hazardClassification: HazardClassification;
  storageLocation: string | null;
  quantity: number;
  unit: string;
  supplierId: string | null;
  expiryDate: string | null;
  msdsUrl: string | null;
  usageDescription: string | null;
  riskRating: RiskRating | null;
  emergencyProcedures: string | null;
  ppeRequirements: string | null;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  recordedBy: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentalIncident {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  incidentType: IncidentType;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  incidentDate: string;
  location: string | null;
  rootCause: string | null;
  capaId: string | null;
  investigationStatus: InvestigationStatus | null;
  investigationNotes: string | null;
  evidenceUrls: string[];
  timeline: Record<string, unknown>[];
  responsiblePersonId: string | null;
  reportedBy: string | null;
  resolvedBy: string | null;
  resolutionDate: string | null;
  resolutionNotes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentalRisk {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  aspect: string;
  impact: string;
  likelihood: LikelihoodLevel;
  severity: SeverityLevel;
  riskScore: number;
  controls: string | null;
  mitigationMeasures: string | null;
  monitoringPlan: string | null;
  responsibleOwnerId: string | null;
  reviewSchedule: ReviewSchedule | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  status: RiskStatus;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permit {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  permitType: PermitType;
  permitNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  renewalDate: string | null;
  status: PermitStatus;
  conditions: string | null;
  supportingDocuments: string[];
  approvalHistory: Record<string, unknown>[];
  responsiblePersonId: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceUsage {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  departmentId: string | null;
  resourceType: ResourceType;
  consumptionAmount: number;
  unit: string;
  cost: number | null;
  consumptionDate: string;
  reportingPeriod: string;
  efficiencyRating: number | null;
  intensityMetric: number | null;
  recordedBy: string | null;
  isVerified: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentalProject {
  id: string;
  organizationId: string;
  facilityId: string | null;
  projectName: string;
  description: string | null;
  projectType: EnvironmentalProjectType;
  status: ProjectStatus;
  budget: number | null;
  actualCost: number | null;
  startDate: string | null;
  endDate: string | null;
  ownerId: string | null;
  location: string | null;
  areaCovered: number | null;
  treesPlanted: number | null;
  evidenceUrls: string[];
  progressNotes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentalDashboard {
  totalWaterUsage: number;
  totalWasteGenerated: number;
  totalWasteRecycled: number;
  hazardousWaste: number;
  totalAirEmissions: number;
  totalChemicals: number;
  activeIncidents: number;
  complianceScore: number;
  totalPermits: number;
  activePermits: number;
  expiringPermits: number;
  totalRisks: number;
  highRisks: number;
  totalProjects: number;
  activeProjects: number;
  resourceEfficiency: number;
  monthlyWaterTrend: { month: string; usage: number }[];
  monthlyWasteTrend: { month: string; generated: number; recycled: number }[];
  monthlyAirTrend: { month: string; emissions: number }[];
  incidentTrend: { month: string; count: number }[];
  permitStatusDistribution: { status: string; count: number }[];
  riskScoreDistribution: { level: string; count: number }[];
  facilityComparison: { facilityName: string; waterUsage: number; waste: number; emissions: number }[];
  topWasteTypes: { wasteType: string; quantity: number }[];
  topChemicals: { chemicalName: string; quantity: number }[];
}
