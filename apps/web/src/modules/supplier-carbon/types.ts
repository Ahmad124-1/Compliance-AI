export type CarbonScope = 'scope_1' | 'scope_2' | 'scope_3';

export interface SupplierCarbonRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  scope: CarbonScope;
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

export interface CarbonTarget {
  id: string;
  supplierId: string;
  scope: CarbonScope;
  targetValue: number;
  baselineValue: number;
  unit: string;
  targetYear: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'missed';
  createdAt: string;
}