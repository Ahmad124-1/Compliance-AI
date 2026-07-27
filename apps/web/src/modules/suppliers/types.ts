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