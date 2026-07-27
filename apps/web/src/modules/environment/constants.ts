export const ENVIRONMENT_ENDPOINTS = {
  dashboard: '/api/v1/environment/dashboard',
  water: '/api/v1/environment/water',
  waste: '/api/v1/environment/waste',
  air: '/api/v1/environment/air',
  chemicals: '/api/v1/environment/chemicals',
  incidents: '/api/v1/environment/incidents',
  risks: '/api/v1/environment/risks',
  permits: '/api/v1/environment/permits',
  resources: '/api/v1/environment/resources',
  projects: '/api/v1/environment/projects',
} as const;

export const WATER_SOURCE_TYPES = [
  { value: 'ground_water', label: 'Ground Water' },
  { value: 'municipal', label: 'Municipal Water' },
  { value: 'rainwater', label: 'Rainwater' },
  { value: 'recycled', label: 'Recycled Water' },
  { value: 'surface_water', label: 'Surface Water' },
  { value: 'other', label: 'Other' },
] as const;

export const WASTE_TYPES = [
  { value: 'general', label: 'General Waste' },
  { value: 'hazardous', label: 'Hazardous Waste' },
  { value: 'electronic', label: 'Electronic Waste' },
  { value: 'plastic', label: 'Plastic Waste' },
  { value: 'paper', label: 'Paper Waste' },
  { value: 'organic', label: 'Organic Waste' },
  { value: 'metal', label: 'Metal Waste' },
  { value: 'chemical', label: 'Chemical Waste' },
  { value: 'medical', label: 'Medical Waste' },
  { value: 'construction', label: 'Construction Waste' },
  { value: 'other', label: 'Other' },
] as const;

export const AIR_EMISSION_TYPES = [
  { value: 'stack', label: 'Stack Emissions' },
  { value: 'boiler', label: 'Boiler Emissions' },
  { value: 'generator', label: 'Generator Emissions' },
  { value: 'dust', label: 'Dust' },
  { value: 'voc', label: 'VOC' },
  { value: 'nox', label: 'NOx' },
  { value: 'sox', label: 'SOx' },
  { value: 'pm25', label: 'PM2.5' },
  { value: 'pm10', label: 'PM10' },
  { value: 'co', label: 'CO' },
  { value: 'co2', label: 'CO₂' },
  { value: 'methane', label: 'Methane' },
  { value: 'other', label: 'Other' },
] as const;

export const MONITORING_FREQUENCIES = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'other', label: 'Other' },
] as const;

export const HAZARD_CLASSIFICATIONS = [
  { value: 'flammable', label: 'Flammable' },
  { value: 'toxic', label: 'Toxic' },
  { value: 'corrosive', label: 'Corrosive' },
  { value: 'explosive', label: 'Explosive' },
  { value: 'reactive', label: 'Reactive' },
  { value: 'environmental', label: 'Environmental Hazard' },
  { value: 'carcinogen', label: 'Carcinogen' },
  { value: 'mutagen', label: 'Mutagen' },
  { value: 'oxidizer', label: 'Oxidizer' },
  { value: 'irritant', label: 'Irritant' },
  { value: 'other', label: 'Other' },
] as const;

export const RISK_RATINGS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'extreme', label: 'Extreme' },
] as const;

export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
] as const;

export const INCIDENT_TYPES = [
  { value: 'chemical_spill', label: 'Chemical Spill' },
  { value: 'water_leak', label: 'Water Leak' },
  { value: 'oil_spill', label: 'Oil Spill' },
  { value: 'air_pollution', label: 'Air Pollution' },
  { value: 'illegal_disposal', label: 'Illegal Disposal' },
  { value: 'hazardous_release', label: 'Hazardous Release' },
  { value: 'permit_violation', label: 'Permit Violation' },
  { value: 'environmental_complaint', label: 'Environmental Complaint' },
  { value: 'noise_pollution', label: 'Noise Pollution' },
  { value: 'soil_contamination', label: 'Soil Contamination' },
  { value: 'other', label: 'Other' },
] as const;

export const INCIDENT_SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const INCIDENT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'contained', label: 'Contained' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'escalated', label: 'Escalated' },
] as const;

export const INVESTIGATION_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'not_required', label: 'Not Required' },
] as const;

export const LIKELIHOOD_LEVELS = [
  { value: 'rare', label: 'Rare' },
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'possible', label: 'Possible' },
  { value: 'likely', label: 'Likely' },
  { value: 'almost_certain', label: 'Almost Certain' },
] as const;

export const SEVERITY_LEVELS = [
  { value: 'negligible', label: 'Negligible' },
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'major', label: 'Major' },
  { value: 'severe', label: 'Severe' },
] as const;

export const RISK_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'mitigated', label: 'Mitigated' },
  { value: 'closed', label: 'Closed' },
  { value: 'accepted', label: 'Accepted' },
] as const;

export const REVIEW_SCHEDULES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'bi_annual', label: 'Bi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'as_needed', label: 'As Needed' },
] as const;

export const PERMIT_TYPES = [
  { value: 'water', label: 'Water Permit' },
  { value: 'air', label: 'Air Permit' },
  { value: 'waste', label: 'Waste License' },
  { value: 'chemical', label: 'Chemical License' },
  { value: 'environmental_approval', label: 'Environmental Approval' },
  { value: 'discharge', label: 'Discharge Permit' },
  { value: 'emission', label: 'Emission Permit' },
  { value: 'storage', label: 'Storage Permit' },
  { value: 'transport', label: 'Transport Permit' },
  { value: 'other', label: 'Other' },
] as const;

export const PERMIT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'pending', label: 'Pending' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'renewed', label: 'Renewed' },
] as const;

export const RESOURCE_TYPES = [
  { value: 'electricity', label: 'Electricity' },
  { value: 'gas', label: 'Gas' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'steam', label: 'Steam' },
  { value: 'compressed_air', label: 'Compressed Air' },
  { value: 'water', label: 'Water' },
  { value: 'other', label: 'Other' },
] as const;

export const ENVIRONMENTAL_PROJECT_TYPES = [
  { value: 'protected_area', label: 'Protected Area' },
  { value: 'tree_plantation', label: 'Tree Plantation' },
  { value: 'green_area', label: 'Green Area' },
  { value: 'wildlife', label: 'Wildlife' },
  { value: 'habitat_protection', label: 'Habitat Protection' },
  { value: 'restoration', label: 'Restoration Project' },
  { value: 'environmental_initiative', label: 'Environmental Initiative' },
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
