export const SUPPLIERS_ENDPOINTS = {
  suppliers: '/api/v1/suppliers',
  supplierStats: '/api/v1/suppliers/stats',
  supplierRanking: '/api/v1/suppliers/ranking',
  supplier: (id: string) => `/api/v1/suppliers/${id}`,
  supplierFacilities: (id: string) => `/api/v1/suppliers/${id}/facilities`,
  facilities: '/api/v1/suppliers/facilities',
} as const;

export const SUPPLIER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'blacklisted', label: 'Blacklisted' },
] as const;

export const SUPPLIER_RISK_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const SUPPLIER_CATEGORIES = [
  { value: 'raw_material', label: 'Raw Material' },
  { value: 'component', label: 'Component' },
  { value: 'service', label: 'Service' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'other', label: 'Other' },
] as const;

export const SUPPLIER_INDUSTRIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'textile', label: 'Textile' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'construction', label: 'Construction' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'pharmaceutical', label: 'Pharmaceutical' },
  { value: 'technology', label: 'Technology' },
  { value: 'energy', label: 'Energy' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
] as const;

export const FACILITY_TYPES = [
  { value: 'factory', label: 'Factory' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'production_site', label: 'Production Site' },
  { value: 'office', label: 'Office' },
  { value: 'distribution_center', label: 'Distribution Center' },
  { value: 'other', label: 'Other' },
] as const;