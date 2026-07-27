export type FacilityType =
  | 'factory'
  | 'plant'
  | 'warehouse'
  | 'head_office'
  | 'regional_office'
  | 'distribution_center';

export type EmissionSourceCategory =
  | 'fuel_consumption'
  | 'electricity'
  | 'steam'
  | 'purchased_energy'
  | 'water'
  | 'waste'
  | 'business_travel'
  | 'flights'
  | 'hotels'
  | 'employee_commuting'
  | 'freight'
  | 'shipping'
  | 'raw_materials'
  | 'packaging'
  | 'suppliers'
  | 'purchased_goods'
  | 'refrigerants'
  | 'industrial_processes'
  | 'other';

export type EmissionSourceType =
  | 'diesel'
  | 'petrol'
  | 'natural_gas'
  | 'coal'
  | 'generators'
  | 'company_vehicles'
  | 'electricity'
  | 'steam'
  | 'purchased_cooling'
  | 'water'
  | 'waste'
  | 'flights'
  | 'hotels'
  | 'commute'
  | 'freight'
  | 'shipping'
  | 'raw_materials'
  | 'packaging'
  | 'suppliers'
  | 'refrigerants'
  | 'industrial'
  | 'custom';

export type CalculationMethod = 'standard' | 'mass_balance' | 'engineering_estimate' | 'metered_data' | 'manual';

export type FactorType = 'electricity' | 'fuel' | 'waste' | 'travel' | 'supplier' | 'country' | 'custom';

export type ProjectStatus = 'planning' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type ProjectType =
  | 'solar_installation'
  | 'led_replacement'
  | 'ev_fleet'
  | 'water_conservation'
  | 'waste_reduction'
  | 'recycling'
  | 'process_optimization'
  | 'energy_efficiency'
  | 'renewable_energy'
  | 'other';

export type OffsetType = 'carbon_credit' | 'verified_carbon' | 'gold_standard' | 'other';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type TargetType = 'net_zero' | 'annual' | 'department' | 'facility' | 'scope' | 'reduction_plan';

export type TargetStatus = 'not_started' | 'in_progress' | 'at_risk' | 'achieved' | 'missed' | 'paused' | 'archived';

export type CarbonReportType =
  | 'carbon_inventory'
  | 'ghg_inventory'
  | 'emission_summary'
  | 'scope_report'
  | 'facility_report'
  | 'project_report'
  | 'reduction_report'
  | 'executive_report'
  | 'cdp_report'
  | 'sbti_report';

export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  facilityType: FacilityType;
  address: Record<string, unknown>;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionSource {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  sourceCategory: EmissionSourceCategory;
  sourceType: EmissionSourceType;
  scopeId: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GhgScope {
  id: string;
  organizationId: string;
  name: string;
  scopeNumber: 1 | 2 | 3;
  description: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionRecord {
  id: string;
  organizationId: string;
  facilityId: string | null;
  emissionSourceId: string | null;
  scopeId: string | null;
  activityType: string;
  activityData: Record<string, unknown>;
  co2e: number;
  co2: number | null;
  ch4: number | null;
  n2o: number | null;
  hfc: number | null;
  pfc: number | null;
  sf6: number | null;
  unit: string;
  emissionDate: string;
  reportingPeriod: string;
  calculationMethod: CalculationMethod;
  emissionFactorId: string | null;
  manualOverride: boolean;
  overrideReason: string | null;
  notes: string | null;
  recordedBy: string | null;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmissionFactor {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  factorType: FactorType;
  category: string;
  subcategory: string | null;
  value: number;
  unit: string;
  source: string;
  sourceUrl: string | null;
  geography: string | null;
  effectiveDate: string;
  expiryDate: string | null;
  version: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonProject {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  budget: number | null;
  ownerId: string | null;
  startDate: string | null;
  endDate: string | null;
  expectedReductionTco2e: number | null;
  actualReductionTco2e: number | null;
  roi: number | null;
  evidence: string | null;
  isVerified: boolean;
  verificationDate: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonOffset {
  id: string;
  organizationId: string;
  projectId: string | null;
  name: string;
  description: string | null;
  offsetType: OffsetType;
  registry: string | null;
  registryId: string | null;
  creditsPurchased: number;
  creditsRetired: number;
  purchaseDate: string;
  expiryDate: string | null;
  costPerTon: number | null;
  totalCost: number | null;
  certificateUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReductionTarget {
  id: string;
  organizationId: string;
  facilityId: string | null;
  scopeId: string | null;
  name: string;
  description: string | null;
  targetType: TargetType;
  baselineEmissionsTco2e: number;
  targetEmissionsTco2e: number;
  baselineYear: number;
  targetYear: number;
  currentEmissionsTco2e: number | null;
  progressPct: number;
  status: TargetStatus;
  milestones: Record<string, unknown>[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonReport {
  id: string;
  organizationId: string;
  facilityId: string | null;
  name: string;
  description: string | null;
  reportType: CarbonReportType;
  format: ReportFormat;
  generatedBy: string | null;
  status: 'draft' | 'generated' | 'archived';
  fileUrl: string | null;
  summary: string | null;
  params: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationHistory {
  id: string;
  organizationId: string;
  emissionRecordId: string | null;
  calculationType: string;
  inputData: Record<string, unknown>;
  emissionFactorId: string | null;
  resultCo2e: number;
  resultBreakdown: Record<string, unknown>;
  methodology: string;
  calculatedBy: string | null;
  isDeleted: boolean;
  createdAt: string;
}

export interface CarbonDashboard {
  totalEmissions: number;
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  carbonIntensity: number;
  totalFacilities: number;
  totalProjects: number;
  activeProjects: number;
  totalOffsets: number;
  totalCreditsRetired: number;
  netEmissions: number;
  reductionTargetsCount: number;
  achievedTargetsCount: number;
  topEmissionSources: { sourceName: string; co2e: number }[];
  monthlyEmissions: { month: string; scope1: number; scope2: number; scope3: number }[];
  yearlyEmissions: { year: string; total: number }[];
  reductionProgress: number;
  facilityComparison: { facilityName: string; emissions: number }[];
}