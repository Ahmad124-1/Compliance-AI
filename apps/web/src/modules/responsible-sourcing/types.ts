export type MaterialCategory = 'raw_material' | 'conflict_mineral' | 'palm_oil' | 'cotton' | 'timber' | 'recycled_material' | 'mineral' | 'chemical' | 'component' | 'other';
export type ChainOfCustodyStatus = 'not_verified' | 'in_progress' | 'verified' | 'suspended' | 'revoked';
export type TraceabilityStatus = 'unknown' | 'partial' | 'full' | 'unverified';

export interface ResponsibleMaterialRecord {
  id: string;
  organizationId: string;
  supplierId: string;
  materialName: string;
  materialCategory: MaterialCategory;
  countryOfOrigin: string | null;
  traceabilityId: string | null;
  traceabilityStatus: TraceabilityStatus;
  supplyChainMapping: SupplyChainLink[];
  certifyingBody: string | null;
  certificationStatus: string | null;
  chainOfCustody: ChainOfCustodyStatus;
  quantity: number | null;
  unit: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyChainLink {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  country: string | null;
  region: string | null;
  relationshipType: 'direct' | 'tier_2' | 'tier_3' | 'tier_n';
}

export interface SourcingSummary {
  totalMaterials: number;
  materialsByCategory: Record<string, number>;
  conflictFreeRate: number;
  traceabilityRate: number;
  chainOfCustodyVerified: number;
  countryBreakdown: Record<string, number>;
}