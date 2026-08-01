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
  environmentalScore: number;
  openCorrectiveActions: number;
  waterConsumption: number;
  wasteGenerated: number;
  wasteRecycled: number;
  chemicalInventory: number;
  biodiversityKpiCount: number;
  objectiveCount: number;
  monthlyWaterTrend: { month: string; usage: number }[];
  monthlyWasteTrend: { month: string; generated: number; recycled: number }[];
  monthlyAirTrend: { month: string; emissions: number }[];
  incidentTrend: { month: string; count: number }[];
  permitStatusDistribution: { status: string; count: number }[];
  riskScoreDistribution: { level: string; count: number }[];
  facilityComparison: { facilityName: string; waterUsage: number; waste: number; emissions: number }[];
  topWasteTypes: { wasteType: string; quantity: number }[];
  topChemicals: { chemicalName: string; quantity: number }[];
  departmentComparison: { departmentName: string; score: number }[];
  upcomingPermitRenewals: Permit[];
}

// -- Water Targets --
export type WaterTargetType = 'reduction' | 'intensity' | 'reuse' | 'recycling' | 'discharge_quality' | 'other';
export interface WaterTarget {
  id: string;
  organizationId: string;
  facilityId: string | null;
  departmentId: string | null;
  name: string;
  description: string | null;
  targetType: WaterTargetType;
  baselineValue: number;
  targetValue: number;
  currentValue: number | null;
  unit: string;
  baselineYear: number;
  targetYear: number;
  status: 'active' | 'achieved' | 'missed' | 'paused' | 'archived';
  ownerId: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Waste Vendors --
export type WasteVendorType = 'recycler' | 'disposal' | 'treatment' | 'collection' | 'transport' | 'other';
export interface WasteVendor {
  id: string;
  organizationId: string;
  name: string;
  vendorType: WasteVendorType;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  wasteTypesAccepted: string[];
  certifications: string[];
  contractStart: string | null;
  contractEnd: string | null;
  pricingNotes: string | null;
  isApproved: boolean;
  rating: number | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Waste Targets --
export type WasteTargetType = 'reduction' | 'recycling' | 'diversion' | 'intensity' | 'cost_reduction' | 'other';
export interface WasteTarget {
  id: string;
  organizationId: string;
  facilityId: string | null;
  departmentId: string | null;
  name: string;
  description: string | null;
  wasteType: string;
  targetType: WasteTargetType;
  baselineValue: number;
  targetValue: number;
  currentValue: number | null;
  unit: string;
  baselineYear: number;
  targetYear: number;
  status: 'active' | 'achieved' | 'missed' | 'paused' | 'archived';
  ownerId: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Air Emission Limits --
export interface AirEmissionLimit {
  id: string;
  organizationId: string;
  facilityId: string | null;
  permitId: string | null;
  emissionType: AirEmissionType;
  limitValue: number;
  limitUnit: string;
  monitoringFrequency: string;
  maxConcentration: number | null;
  concentrationUnit: string;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Chemical Container --
export type ContainerType = 'drum' | 'tote' | 'cylinder' | 'tank' | 'bottle' | 'bag' | 'other';
export type ContainerStatus = 'in_use' | 'empty' | 'stored' | 'disposed' | 'in_transit';
export interface ChemicalContainer {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  chemicalId: string;
  containerType: ContainerType;
  capacity: number;
  capacityUnit: string;
  currentQuantity: number;
  quantityUnit: string;
  storageLocation: string | null;
  storageArea: string | null;
  hazardClassification: string | null;
  status: ContainerStatus;
  fillDate: string | null;
  emptyDate: string | null;
  inspectionFrequency: string;
  lastInspectionDate: string | null;
  nextInspectionDate: string | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Chemical Spill --
export type CleanupStatus = 'pending' | 'in_progress' | 'completed' | 'verified';
export interface ChemicalSpill {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  chemicalId: string | null;
  incidentId: string | null;
  spillDate: string;
  quantitySpilled: number;
  quantityUnit: string;
  spillLocation: string;
  spillCause: string | null;
  containmentAction: string | null;
  cleanupAction: string | null;
  cleanupStatus: CleanupStatus;
  cleanupDate: string | null;
  cleanedBy: string | null;
  environmentalImpact: string | null;
  reportable: boolean;
  reportedToAuthority: boolean;
  authorityName: string | null;
  authorityReference: string | null;
  costs: number | null;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Biodiversity --
export type BiodiversityRecordType =
  | 'protected_area' | 'land_usage' | 'tree_plantation' | 'tree_loss'
  | 'habitat_restoration' | 'species_monitoring' | 'community_project' | 'green_area' | 'other';
export type RestorationStatus = 'planning' | 'in_progress' | 'completed' | 'monitoring' | 'cancelled';
export type BiodiversityStatus = 'active' | 'completed' | 'cancelled' | 'planned';
export interface BiodiversityRecord {
  id: string;
  organizationId: string;
  facilityId: string | null;
  siteId: string | null;
  recordType: BiodiversityRecordType;
  name: string;
  description: string | null;
  location: string | null;
  areaSize: number | null;
  areaUnit: string;
  treesPlanted: number;
  treesLost: number;
  speciesCount: number | null;
  speciesList: string[];
  protectedSpecies: string[];
  restorationArea: number | null;
  restorationStatus: RestorationStatus | null;
  communityParticipants: number | null;
  communityPartner: string | null;
  fundingAmount: number | null;
  fundingSource: string | null;
  status: BiodiversityStatus;
  startDate: string | null;
  endDate: string | null;
  evidenceUrls: string[];
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiodiversityKpis {
  totalProtectedArea: number;
  totalTreesPlanted: number;
  totalTreesLost: number;
  netTreeGain: number;
  totalSpeciesMonitored: number;
  restorationProjects: number;
  communityProjects: number;
  communityParticipants: number;
}

// -- Environmental Objectives --
export type ObjectiveType =
  | 'waste_reduction' | 'water_reduction' | 'energy_efficiency' | 'emission_reduction'
  | 'pollution_prevention' | 'recycling' | 'biodiversity' | 'compliance'
  | 'training' | 'chemical_safety' | 'incident_reduction' | 'other';
export type ObjectiveStatus = 'draft' | 'in_progress' | 'achieved' | 'missed' | 'cancelled' | 'on_hold';
export type ObjectivePriority = 'low' | 'medium' | 'high' | 'critical';

export interface EnvironmentalObjective {
  id: string;
  organizationId: string;
  facilityId: string | null;
  departmentId: string | null;
  parentObjectiveId: string | null;
  linkedGoalId: string | null;
  linkedProgramId: string | null;
  name: string;
  description: string | null;
  objectiveType: ObjectiveType;
  priority: ObjectivePriority;
  baselineValue: number | null;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  startDate: string;
  targetDate: string;
  status: ObjectiveStatus;
  ownerId: string | null;
  evidenceUrls: string[];
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectiveMilestone {
  id: string;
  objectiveId: string;
  name: string;
  description: string | null;
  targetValue: number | null;
  currentValue: number | null;
  targetDate: string;
  completionDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'missed' | 'cancelled';
  ownerId: string | null;
  sortOrder: number;
  notes: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Environmental Report --
export type EnvironmentalReportType =
  | 'environmental' | 'water' | 'waste' | 'air' | 'chemical'
  | 'incident' | 'permit' | 'biodiversity' | 'executive' | 'compliance';
export type ReportSchedule = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface EnvironmentalReport {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  reportType: EnvironmentalReportType;
  format: string;
  status: 'draft' | 'generated' | 'archived';
  summary: string | null;
  fileUrl: string | null;
  params: Record<string, unknown>;
  schedule: ReportSchedule;
  generatedBy: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// -- Water KPIs --
export interface WaterKpis {
  totalConsumption: number;
  totalDischarge: number;
  totalReuse: number;
  reuseRate: number;
  averageIntensity: number;
  leakCount: number;
  costTotal: number;
  facilityCount: number;
  sourceDistribution: { sourceType: string; amount: number }[];
  monthlyTrend: { month: string; consumption: number; discharge: number }[];
}

// -- Waste KPIs --
export interface WasteKpis {
  totalGenerated: number;
  totalRecycled: number;
  totalDisposed: number;
  recyclingRate: number;
  diversionRate: number;
  hazardousTotal: number;
  costTotal: number;
  typeDistribution: { wasteType: string; quantity: number }[];
  monthlyTrend: { month: string; generated: number; recycled: number }[];
}

// -- Air KPIs --
export interface AirKpis {
  totalEmissions: number;
  averageConcentration: number;
  limitCompliance: number;
  sourceCount: number;
  typeDistribution: { emissionType: string; quantity: number }[];
  monthlyTrend: { month: string; emissions: number }[];
  limitBreaches: number;
}

// -- AI Insights --
export interface EnvironmentalAiInsights {
  summary: string;
  riskAlerts: { title: string; description: string; severity: string }[];
  recommendations: { title: string; description: string; impact: string }[];
  complianceIssues: { title: string; description: string; status: string }[];
  trends: { title: string; description: string; direction: string }[];
  anomalies: { title: string; description: string; severity: string }[];
}

export interface EnvironmentalExecutiveSummary {
  executiveSummary: string;
  environmentalScore: number;
  complianceScore: number;
  keyMetrics: { label: string; value: number; unit: string; trend: string }[];
  topRisks: string[];
  recommendations: string[];
  focusAreas: string[];
}
