import { airEmissionRepo } from '../repositories/air-emission.repo.js';
import { chemicalRepo } from '../repositories/chemical.repo.js';
import { environmentalIncidentRepo } from '../repositories/environmental-incident.repo.js';
import { permitRepo } from '../repositories/permit.repo.js';
import { wasteRecordRepo } from '../repositories/waste-record.repo.js';
import { waterUsageRepo } from '../repositories/water-usage.repo.js';
import { environmentalObjectiveRepo } from '../repositories/environmental-objective.repo.js';
import { biodiversityRepo } from '../repositories/biodiversity.repo.js';

export const environmentalAiService = {
  async getEnvironmentalInsights(orgId: string) {
    const insights: Array<{ type: string; title: string; description: string; severity: string; data: Record<string, unknown> }> = [];

    // Water insights
    const waterRecords = await waterUsageRepo.listByOrganization(orgId);
    const totalWater = waterRecords.reduce((s, r) => s + r.consumptionAmount, 0);
    const waterLeaks = waterRecords.filter(r => r.leakDetected).length;
    if (waterLeaks > 0) {
      insights.push({
        type: 'water_optimization',
        title: 'Water Leaks Detected',
        description: `${waterLeaks} water leak(s) detected in the reporting period. Recommend inspection and repair.`,
        severity: 'warning',
        data: { leakCount: waterLeaks, totalConsumption: totalWater },
      });
    }

    // Waste insights
    const wasteRecords = await wasteRecordRepo.listByOrganization(orgId);
    const hazardousWaste = wasteRecords.filter(r => r.wasteType === 'hazardous').reduce((s, r) => s + r.quantity, 0);
    if (hazardousWaste > 1000) {
      insights.push({
        type: 'waste_reduction',
        title: 'High Hazardous Waste Generation',
        description: `Hazardous waste generation is ${hazardousWaste.toFixed(0)} kg. Evaluate waste minimization opportunities.`,
        severity: 'warning',
        data: { hazardousWaste },
      });
    }

    // Compliance insights
    const permits = await permitRepo.listByOrganization(orgId);
    const expiringPermits = permits.filter(p => p.status === 'active' && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    if (expiringPermits.length > 0) {
      insights.push({
        type: 'compliance_recommendation',
        title: 'Permits Expiring Soon',
        description: `${expiringPermits.length} permit(s) will expire within 30 days. Initiate renewal process.`,
        severity: 'critical',
        data: { expiringPermits: expiringPermits.map(p => ({ permitNumber: p.permitNumber, expiryDate: p.expiryDate })) },
      });
    }

    const expiredPermits = permits.filter(p => p.status === 'expired');
    if (expiredPermits.length > 0) {
      insights.push({
        type: 'compliance_recommendation',
        title: 'Expired Permits Detected',
        description: `${expiredPermits.length} permit(s) are expired. Review and renew immediately to maintain compliance.`,
        severity: 'critical',
        data: { expiredPermits: expiredPermits.map(p => ({ permitNumber: p.permitNumber, permitType: p.permitType })) },
      });
    }

    // Incident insights
    const incidents = await environmentalIncidentRepo.listByOrganization(orgId);
    const openCritical = incidents.filter(i => i.severity === 'critical' && i.status !== 'closed' && i.status !== 'resolved');
    if (openCritical.length > 0) {
      insights.push({
        type: 'risk_detection',
        title: 'Critical Incidents Require Attention',
        description: `${openCritical.length} critical environmental incident(s) are still open. Immediate action required.`,
        severity: 'critical',
        data: { criticalIncidents: openCritical.map(i => ({ title: i.title, incidentDate: i.incidentDate })) },
      });
    }

    // Chemical safety insights
    const chemicals = await chemicalRepo.listByOrganization(orgId);
    const highRiskChemicals = chemicals.filter(c => c.riskRating === 'extreme' || c.riskRating === 'high');
    if (highRiskChemicals.length > 0) {
      insights.push({
        type: 'chemical_safety',
        title: 'High-Risk Chemicals in Inventory',
        description: `${highRiskChemicals.length} chemical(s) with high/extreme risk rating. Review safety protocols.`,
        severity: 'warning',
        data: { highRiskChemicals: highRiskChemicals.map(c => ({ chemicalName: c.chemicalName, riskRating: c.riskRating })) },
      });
    }

    // Air emissions trend
    const airRecords = await airEmissionRepo.listByOrganization(orgId);
    if (airRecords.length > 6) {
      insights.push({
        type: 'trend_analysis',
        title: 'Air Emissions Data Available',
        description: `${airRecords.length} air emission records logged. Consider running trend analysis for compliance monitoring.`,
        severity: 'info',
        data: { totalRecords: airRecords.length },
      });
    }

    // Biodiversity insights
    const biodiversity = await biodiversityRepo.listByOrganization(orgId);
    const totalTrees = biodiversity.reduce((s, r) => s + r.treesPlanted, 0);
    if (totalTrees > 0) {
      insights.push({
        type: 'executive_summary',
        title: 'Biodiversity Contribution',
        description: `Total ${totalTrees} trees planted across ${biodiversity.length} biodiversity projects.`,
        severity: 'positive',
        data: { treesPlanted: totalTrees, projectCount: biodiversity.length },
      });
    }

    // Objective progress
    const objectives = await environmentalObjectiveRepo.listByOrganization(orgId);
    const completedObjectives = objectives.filter(o => o.status === 'achieved');
    const atRiskObjectives = objectives.filter(o => o.status === 'in_progress' && o.progressPct < 50);
    if (atRiskObjectives.length > 0) {
      insights.push({
        type: 'risk_detection',
        title: 'Environmental Objectives At Risk',
        description: `${atRiskObjectives.length} objective(s) are below 50% progress. Review and adjust action plans.`,
        severity: 'warning',
        data: { atRiskObjectives: atRiskObjectives.map(o => ({ name: o.name, progressPct: o.progressPct })) },
      });
    }

    return insights;
  },

  async getExecutiveSummary(orgId: string) {
    const water = await waterUsageRepo.listByOrganization(orgId);
    const waste = await wasteRecordRepo.listByOrganization(orgId);
    const air = await airEmissionRepo.listByOrganization(orgId);
    const chemicals = await chemicalRepo.listByOrganization(orgId);
    const incidents = await environmentalIncidentRepo.listByOrganization(orgId);
    const permits = await permitRepo.listByOrganization(orgId);
    const biodiversity = await biodiversityRepo.listByOrganization(orgId);
    const objectives = await environmentalObjectiveRepo.listByOrganization(orgId);

    const totalWater = water.reduce((s, r) => s + r.consumptionAmount, 0);
    const totalWaste = waste.reduce((s, r) => s + r.quantity, 0);
    const totalAir = air.reduce((s, r) => s + r.quantity, 0);
    const activePermits = permits.filter(p => p.status === 'active').length;
    const totalPermits = permits.length;
    const complianceScore = totalPermits > 0 ? Math.round((activePermits / totalPermits) * 100) : 100;
    const openIncidents = incidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;
    const totalTrees = biodiversity.reduce((s, r) => s + r.treesPlanted, 0);
    const achievedObjectives = objectives.filter(o => o.status === 'achieved').length;
    const totalObjectives = objectives.length;

    return {
      environmentalScore: complianceScore,
      waterConsumption: parseFloat(totalWater.toFixed(2)),
      wasteGenerated: parseFloat(totalWaste.toFixed(2)),
      airEmissions: parseFloat(totalAir.toFixed(2)),
      chemicalCount: chemicals.length,
      openIncidents,
      complianceScore,
      activePermits,
      totalPermits,
      expiringPermits: permits.filter(p => p.status === 'active' && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length,
      treesPlanted: totalTrees,
      objectivesAchieved: achievedObjectives,
      totalObjectives,
      objectiveProgress: totalObjectives > 0 ? Math.round((achievedObjectives / totalObjectives) * 100) : 0,
      summary: `Environmental compliance score: ${complianceScore}%. ${totalWater.toFixed(0)} m³ water used, ${totalWaste.toFixed(0)} kg waste generated, ${totalAir.toFixed(0)} kg air emissions. ${openIncidents} open incidents. ${activePermits}/${totalPermits} permits active.`,
    };
  },
};
