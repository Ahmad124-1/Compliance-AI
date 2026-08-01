export const ENVIRONMENT_ENDPOINTS = {
  dashboard: '/api/v1/environment/dashboard',
  water: '/api/v1/environment/water',
  waterTargets: '/api/v1/water/targets',
  waterKpis: '/api/v1/water/kpis',
  waste: '/api/v1/environment/waste',
  wasteVendors: '/api/v1/waste/vendors',
  wasteTargets: '/api/v1/waste/targets',
  wasteKpis: '/api/v1/waste/kpis',
  air: '/api/v1/environment/air',
  airLimits: '/api/v1/air/limits',
  airKpis: '/api/v1/air/kpis',
  chemicals: '/api/v1/environment/chemicals',
  chemicalContainers: '/api/v1/chemicals/containers',
  chemicalSpills: '/api/v1/chemicals/spills',
  incidents: '/api/v1/environment/incidents',
  risks: '/api/v1/environment/risks',
  permits: '/api/v1/environment/permits',
  permitsRenewals: '/api/v1/environmental-permits/renewals',
  permitsExpired: '/api/v1/environmental-permits/expired',
  resources: '/api/v1/environment/resources',
  projects: '/api/v1/environment/projects',
  biodiversity: '/api/v1/biodiversity',
  biodiversityKpis: '/api/v1/biodiversity/kpis',
  objectives: '/api/v1/environmental-objectives',
  objectivesMilestones: '/api/v1/environmental-objectives/milestones',
  reports: '/api/v1/environmental-reports',
  reportsGenerate: '/api/v1/environmental-reports/generate',
  aiInsights: '/api/v1/environment/ai/insights',
  aiExecutiveSummary: '/api/v1/environment/ai/executive-summary',
} as const;

export const WATER_SOURCE_TYPES = [
  { value: 'ground_water', label: 'Ground Water' },
  { value: 'municipal', label: 'Municipal Water' },
  { value: 'rainwater', label: 'Rainwater' },
  { value: 'recycled', label: 'Recycled Water' },
  { value: 'surface_water', label: 'Surface Water' },
  { value: 'other', label: 'Other' },
] as const;

export const WATER_TARGET_TYPES = [
  { value: 'reduction', label: 'Reduction' },
  { value: 'intensity', label: 'Intensity' },
  { value: 'reuse', label: 'Reuse' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'discharge_quality', label: 'Discharge Quality' },
  { value: 'other', label: 'Other' },
] as const;

export const WASTE_TYPES = [
  { value: 'general', label: 'General Waste' },
  { value: 'hazardous', label: 'Hazardous Waste' },
  { value: 'plastic', label: 'Plastic Waste' },
  { value: 'paper', label: 'Paper Waste' },
  { value: 'metal', label: 'Metal Waste' },
  { value: 'food', label: 'Food Waste' },
  { value: 'electronic', label: 'Electronic Waste' },
  { value: 'construction', label: 'Construction Waste' },
  { value: 'medical', label: 'Medical Waste' },
  { value: 'chemical', label: 'Chemical Waste' },
  { value: 'organic', label: 'Organic Waste' },
  { value: 'other', label: 'Other' },
] as const;

export const WASTE_VENDOR_TYPES = [
  { value: 'recycler', label: 'Recycler' },
  { value: 'disposal', label: 'Disposal' },
  { value: 'treatment', label: 'Treatment' },
  { value: 'collection', label: 'Collection' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
] as const;

export const WASTE_TARGET_TYPES = [
  { value: 'reduction', label: 'Reduction' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'diversion', label: 'Diversion' },
  { value: 'intensity', label: 'Intensity' },
  { value: 'cost_reduction', label: 'Cost Reduction' },
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
  { value: 'hazardous_waste', label: 'Hazardous Waste License' },
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

export const BIODIVERSITY_RECORD_TYPES = [
  { value: 'protected_area', label: 'Protected Area' },
  { value: 'land_usage', label: 'Land Usage' },
  { value: 'tree_plantation', label: 'Tree Plantation' },
  { value: 'tree_loss', label: 'Tree Loss' },
  { value: 'habitat_restoration', label: 'Habitat Restoration' },
  { value: 'species_monitoring', label: 'Species Monitoring' },
  { value: 'community_project', label: 'Community Project' },
  { value: 'green_area', label: 'Green Area' },
  { value: 'other', label: 'Other' },
] as const;

export const BIODIVERSITY_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'planned', label: 'Planned' },
] as const;

export const RESTORATION_STATUSES = [
  { value: 'planning', label: 'Planning' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const CONTAINER_TYPES = [
  { value: 'drum', label: 'Drum' },
  { value: 'tote', label: 'Tote' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'tank', label: 'Tank' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'other', label: 'Other' },
] as const;

export const CONTAINER_STATUSES = [
  { value: 'in_use', label: 'In Use' },
  { value: 'empty', label: 'Empty' },
  { value: 'stored', label: 'Stored' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'in_transit', label: 'In Transit' },
] as const;

export const CLEANUP_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'verified', label: 'Verified' },
] as const;

export const OBJECTIVE_TYPES = [
  { value: 'waste_reduction', label: 'Waste Reduction' },
  { value: 'water_reduction', label: 'Water Reduction' },
  { value: 'energy_efficiency', label: 'Energy Efficiency' },
  { value: 'emission_reduction', label: 'Emission Reduction' },
  { value: 'pollution_prevention', label: 'Pollution Prevention' },
  { value: 'recycling', label: 'Recycling' },
  { value: 'biodiversity', label: 'Biodiversity' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'training', label: 'Training' },
  { value: 'chemical_safety', label: 'Chemical Safety' },
  { value: 'incident_reduction', label: 'Incident Reduction' },
  { value: 'other', label: 'Other' },
] as const;

export const OBJECTIVE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'missed', label: 'Missed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

export const OBJECTIVE_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export const MILESTONE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const ENVIRONMENTAL_REPORT_TYPES = [
  { value: 'environmental', label: 'Environmental Report' },
  { value: 'water', label: 'Water Report' },
  { value: 'waste', label: 'Waste Report' },
  { value: 'air', label: 'Air Emissions Report' },
  { value: 'chemical', label: 'Chemical Report' },
  { value: 'incident', label: 'Incident Report' },
  { value: 'permit', label: 'Permit Report' },
  { value: 'biodiversity', label: 'Biodiversity Report' },
  { value: 'executive', label: 'Executive Report' },
  { value: 'compliance', label: 'Compliance Report' },
] as const;

export const REPORT_SCHEDULES = [
  { value: 'none', label: 'No Schedule' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const ENVIRONMENT_REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'docx', label: 'Word' },
] as const;
