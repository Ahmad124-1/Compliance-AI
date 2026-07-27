export const CARBON_ENDPOINTS = {
  facilities: '/api/v1/carbon/facilities',
  emissionSources: '/api/v1/carbon/emission-sources',
  scopes: '/api/v1/carbon/scopes',
  emissions: '/api/v1/carbon/emissions',
  emissionFactors: '/api/v1/carbon/emission-factors',
  projects: '/api/v1/carbon/projects',
  offsets: '/api/v1/carbon/offsets',
  targets: '/api/v1/carbon/targets',
  reports: '/api/v1/carbon/reports',
  dashboard: '/api/v1/carbon/dashboard',
  calculate: '/api/v1/carbon/calculate',
  calculations: '/api/v1/carbon/calculations',
} as const;

export const FACILITY_TYPES = [
  { value: 'factory', label: 'Factory' },
  { value: 'plant', label: 'Plant' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'head_office', label: 'Head Office' },
  { value: 'regional_office', label: 'Regional Office' },
  { value: 'distribution_center', label: 'Distribution Center' },
] as const;

export const EMISSION_SOURCE_CATEGORIES = [
  { value: 'fuel_consumption', label: 'Fuel Consumption' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'steam', label: 'Steam' },
  { value: 'purchased_energy', label: 'Purchased Energy' },
  { value: 'water', label: 'Water' },
  { value: 'waste', label: 'Waste' },
  { value: 'business_travel', label: 'Business Travel' },
  { value: 'flights', label: 'Flights' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'employee_commuting', label: 'Employee Commuting' },
  { value: 'freight', label: 'Freight' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'raw_materials', label: 'Raw Materials' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'purchased_goods', label: 'Purchased Goods' },
  { value: 'refrigerants', label: 'Refrigerants' },
  { value: 'industrial_processes', label: 'Industrial Processes' },
  { value: 'other', label: 'Other' },
] as const;

export const EMISSION_SOURCE_TYPES = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'natural_gas', label: 'Natural Gas' },
  { value: 'coal', label: 'Coal' },
  { value: 'generators', label: 'Generators' },
  { value: 'company_vehicles', label: 'Company Vehicles' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'steam', label: 'Steam' },
  { value: 'purchased_cooling', label: 'Purchased Cooling' },
  { value: 'water', label: 'Water' },
  { value: 'waste', label: 'Waste' },
  { value: 'flights', label: 'Flights' },
  { value: 'hotels', label: 'Hotels' },
  { value: 'commute', label: 'Commute' },
  { value: 'freight', label: 'Freight' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'raw_materials', label: 'Raw Materials' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'refrigerants', label: 'Refrigerants' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'custom', label: 'Custom' },
] as const;

export const EMISSION_SCOPE_OPTIONS = [
  { value: '1', label: 'Scope 1 - Direct Emissions' },
  { value: '2', label: 'Scope 2 - Indirect Energy Emissions' },
  { value: '3', label: 'Scope 3 - Other Indirect Emissions' },
] as const;

export const FACTOR_TYPES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'waste', label: 'Waste' },
  { value: 'travel', label: 'Travel' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'country', label: 'Country' },
  { value: 'custom', label: 'Custom' },
] as const;

export const PROJECT_TYPES = [
  { value: 'solar_installation', label: 'Solar Installation' },
  { value: 'led_replacement', label: 'LED Replacement' },
  { value: 'ev_fleet', label: 'EV Fleet' },
  { value: 'water_conservation', label: 'Water Conservation' },
  { value: 'waste_reduction', label: 'Waste Reduction' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'process_optimization', label: 'Process Optimization' },
  { value: 'energy_efficiency', label: 'Energy Efficiency' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'other', label: 'Other' },
] as const;

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

export const OFFSET_TYPES = [
  { value: 'carbon_credit', label: 'Carbon Credit' },
  { value: 'verified_carbon', label: 'Verified Carbon' },
  { value: 'gold_standard', label: 'Gold Standard' },
  { value: 'other', label: 'Other' },
] as const;

export const VERIFICATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export const TARGET_TYPES = [
  { value: 'net_zero', label: 'Net Zero' },
  { value: 'annual', label: 'Annual' },
  { value: 'department', label: 'Department' },
  { value: 'facility', label: 'Facility' },
  { value: 'scope', label: 'Scope' },
  { value: 'reduction_plan', label: 'Reduction Plan' },
] as const;

export const TARGET_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'missed', label: 'Missed' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export const CARBON_REPORT_TYPES = [
  { value: 'carbon_inventory', label: 'Carbon Inventory' },
  { value: 'ghg_inventory', label: 'GHG Inventory' },
  { value: 'emission_summary', label: 'Emission Summary' },
  { value: 'scope_report', label: 'Scope Report' },
  { value: 'facility_report', label: 'Facility Report' },
  { value: 'project_report', label: 'Project Report' },
  { value: 'reduction_report', label: 'Reduction Report' },
  { value: 'executive_report', label: 'Executive Report' },
  { value: 'cdp_report', label: 'CDP Report' },
  { value: 'sbti_report', label: 'SBTi Report' },
] as const;

export const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
] as const;

export const CALCULATION_METHODS = [
  { value: 'standard', label: 'Standard' },
  { value: 'mass_balance', label: 'Mass Balance' },
  { value: 'engineering_estimate', label: 'Engineering Estimate' },
  { value: 'metered_data', label: 'Metered Data' },
  { value: 'manual', label: 'Manual' },
] as const;

export const REPORTING_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;