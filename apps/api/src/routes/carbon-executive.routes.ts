import type { FastifyInstance } from 'fastify';
import { authenticate, getAuth, requirePermission } from './guard.js';
import { facilityRepo } from '../repositories/facility.repo.js';
import { departmentRepo } from '../repositories/department.repo.js';
import { emissionRecordRepo } from '../repositories/emission-record.repo.js';
import { ghgScopeRepo } from '../repositories/ghg-scope.repo.js';
import { carbonProjectRepo } from '../repositories/carbon-project.repo.js';
import { carbonOffsetRepo } from '../repositories/carbon-offset.repo.js';
import { reductionTargetRepo } from '../repositories/reduction-target.repo.js';
import { sbtiTargetRepo } from '../repositories/sbti-target.repo.js';

export async function carbonExecutiveRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/carbon/executive/dashboard', { preHandler: requirePermission('sustainability:read') }, async (req) => {
    const auth = getAuth(req);
    const orgId = auth.org;

    const records = await emissionRecordRepo.listByOrganization(orgId);
    const scopes = await ghgScopeRepo.listByOrganization(orgId);
    const facilities = await facilityRepo.listByOrganization(orgId);
    const departments = await departmentRepo.listByOrganization(orgId);
    const projects = await carbonProjectRepo.listByOrganization(orgId);
    const offsets = await carbonOffsetRepo.listByOrganization(orgId);
    const targets = await reductionTargetRepo.listByOrganization(orgId);
    const sbtiTargets = await sbtiTargetRepo.listByOrganization(orgId);
    const sbtiStats = await sbtiTargetRepo.getProgressStats(orgId);

    const totalEmissions = records.reduce((s, r) => s + Number(r.co2e), 0);
    const scope1Id = scopes.find(s => s.scopeNumber === 1)?.id;
    const scope2Id = scopes.find(s => s.scopeNumber === 2)?.id;
    const scope3Id = scopes.find(s => s.scopeNumber === 3)?.id;

    const scope1Emissions = records.filter(r => r.scopeId === scope1Id).reduce((s, r) => s + Number(r.co2e), 0);
    const scope2Emissions = records.filter(r => r.scopeId === scope2Id).reduce((s, r) => s + Number(r.co2e), 0);
    const scope3Emissions = records.filter(r => r.scopeId === scope3Id).reduce((s, r) => s + Number(r.co2e), 0);
    const totalCreditsRetired = offsets.reduce((s, o) => s + Number(o.creditsRetired), 0);
    const totalOffsets = offsets.reduce((s, o) => s + Number(o.creditsPurchased), 0);
    const netEmissions = Math.max(0, totalEmissions - totalCreditsRetired);
    const activeFacilities = facilities.filter(f => f.isActive).length;
    const intensity = totalEmissions > 0 ? parseFloat((totalEmissions / Math.max(1, activeFacilities)).toFixed(2)) : 0;
    const carbonCost = totalEmissions * 50; // $50/tCO2e assumed
    const offsetCoverage = totalEmissions > 0 ? Math.min(100, (totalCreditsRetired / totalEmissions) * 100) : 0;
    const targetAchievement = targets.length > 0 ? Math.round(targets.filter(t => t.status === 'achieved').length / targets.length * 100) : 0;
    const reductionPct = sbtiTargets.length > 0 ? sbtiTargets.reduce((s, t) => s + t.reductionPct, 0) / sbtiTargets.length : 0;

    // Year-over-year reduction
    const yearlyMap = new Map<string, number>();
    for (const r of records) {
      const year = r.emissionDate.slice(0, 4);
      yearlyMap.set(year, (yearlyMap.get(year) || 0) + Number(r.co2e));
    }
    const yearlyEntries = Array.from(yearlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const yearOverYearReduction = yearlyEntries.length >= 2
      ? parseFloat((((yearlyEntries[yearlyEntries.length - 2][1] - yearlyEntries[yearlyEntries.length - 1][1]) / Math.max(1, yearlyEntries[yearlyEntries.length - 2][1])) * 100).toFixed(1))
      : 0;

    // Monthly emissions
    const monthlyMap = new Map<string, { scope1: number; scope2: number; scope3: number }>();
    for (const r of records) {
      const month = r.emissionDate.slice(0, 7);
      const cur = monthlyMap.get(month) || { scope1: 0, scope2: 0, scope3: 0 };
      const sn = r.scopeId ? scopes.find(s => s.id === r.scopeId)?.scopeNumber : 0;
      if (sn === 1) cur.scope1 += Number(r.co2e);
      else if (sn === 2) cur.scope2 += Number(r.co2e);
      else cur.scope3 += Number(r.co2e);
      monthlyMap.set(month, cur);
    }
    const monthlyEmissions = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, v]) => ({ month, scope1: parseFloat(v.scope1.toFixed(2)), scope2: parseFloat(v.scope2.toFixed(2)), scope3: parseFloat(v.scope3.toFixed(2)) }));

    // Facility comparison
    const facilityMap = new Map<string, number>();
    for (const r of records) {
      if (r.facilityId) {
        const fac = facilities.find(f => f.id === r.facilityId);
        if (fac) facilityMap.set(fac.name, (facilityMap.get(fac.name) || 0) + Number(r.co2e));
      }
    }
    const facilityComparison = Array.from(facilityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([facilityName, emissions]) => ({ facilityName, emissions: parseFloat(emissions.toFixed(2)) }));

    // Department comparison
    const deptMap = new Map<string, number>();
    for (const r of records) {
      if ((r as any).department_id) {
        const dept = departments.find(d => d.id === (r as any).department_id);
        if (dept) deptMap.set(dept.name, (deptMap.get(dept.name) || 0) + Number(r.co2e));
      }
    }
    const departmentComparison = Array.from(deptMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([departmentName, emissions]) => ({ departmentName, emissions: parseFloat(emissions.toFixed(2)) }));

    // Scope distribution
    const scopeDistribution = [
      { scope: 'Scope 1', percentage: totalEmissions > 0 ? parseFloat(((scope1Emissions / totalEmissions) * 100).toFixed(1)) : 0, co2e: parseFloat(scope1Emissions.toFixed(2)) },
      { scope: 'Scope 2', percentage: totalEmissions > 0 ? parseFloat(((scope2Emissions / totalEmissions) * 100).toFixed(1)) : 0, co2e: parseFloat(scope2Emissions.toFixed(2)) },
      { scope: 'Scope 3', percentage: totalEmissions > 0 ? parseFloat(((scope3Emissions / totalEmissions) * 100).toFixed(1)) : 0, co2e: parseFloat(scope3Emissions.toFixed(2)) },
    ];

    // Top sources
    const sourceMap = new Map<string, number>();
    for (const r of records) {
      sourceMap.set(r.activityType, (sourceMap.get(r.activityType) || 0) + Number(r.co2e));
    }
    const topEmissionSources = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sourceName, co2e]) => ({ sourceName, co2e: parseFloat(co2e.toFixed(2)) }));

    // SBTi progress
    const sbtiProgress = sbtiTargets.filter(t => t.status === 'active').map(t => ({
      targetId: t.id,
      name: t.name,
      progressPct: t.progressPct,
      status: t.status,
    }));

    // Forecast
    const forecast: { year: string; projected: number; baseline: number }[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y <= currentYear + 10; y++) {
      const projected = netEmissions * Math.exp(-0.05 * (y - currentYear));
      forecast.push({
        year: String(y),
        projected: parseFloat(projected.toFixed(2)),
        baseline: parseFloat(totalEmissions.toFixed(2)),
      });
    }

    // AI Insights
    const aiInsights: { type: string; title: string; description: string; severity: string }[] = [];
    if (scope3Emissions > scope1Emissions) {
      aiInsights.push({
        type: 'alert',
        title: 'Scope 3 Dominance',
        description: 'Scope 3 emissions exceed direct emissions. Focus on supplier engagement programs.',
        severity: 'high',
      });
    }
    if (yearOverYearReduction > 0) {
      aiInsights.push({
        type: 'positive',
        title: 'Reduction Trend',
        description: `Emissions decreased ${yearOverYearReduction}% year-over-year. Current trajectory is positive.`,
        severity: 'low',
      });
    }
    if (sbtiStats.total === 0) {
      aiInsights.push({
        type: 'recommendation',
        title: 'Set SBTi Targets',
        description: 'Setting Science Based Targets aligns your organization with climate science.',
        severity: 'medium',
      });
    }

    // Overall carbon score (0-100)
    const scoreComponents = [
      offsetCoverage * 0.15, // 15% weight
      targetAchievement * 0.25, // 25% weight
      Math.max(0, 100 + yearOverYearReduction * 2) * 0.25, // 25% weight for reduction
      (sbtiStats.total > 0 ? sbtiStats.avgProgress : 0) * 0.20, // 20% weight for SBTi progress
      (activeFacilities > 0 ? Math.min(100, (projects.filter(p => p.status === 'in_progress' || p.status === 'completed').length / Math.max(1, activeFacilities)) * 50) : 0) * 0.15, // 15% weight for projects
    ];
    const overallCarbonScore = Math.min(100, Math.round(scoreComponents.reduce((s, c) => s + c, 0)));

    return {
      overallCarbonScore,
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      scope1Emissions: parseFloat(scope1Emissions.toFixed(2)),
      scope2Emissions: parseFloat(scope2Emissions.toFixed(2)),
      scope3Emissions: parseFloat(scope3Emissions.toFixed(2)),
      carbonIntensity: intensity,
      netZeroProgress: sbtiStats.avgProgress,
      yearOverYearReduction,
      carbonCost,
      offsetCoverage: parseFloat(offsetCoverage.toFixed(1)),
      reductionProgress: reductionPct,
      targetAchievement,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      totalOffsets,
      totalCreditsRetired,
      totalFacilities: facilities.length,
      totalDepartments: departments.length,
      topEmissionSources,
      scopeDistribution,
      facilityComparison,
      departmentComparison,
      monthlyEmissions,
      yearlyEmissions: yearlyEntries.map(([year, total]) => ({ year, total: parseFloat(total.toFixed(2)) })),
      sbtiProgress,
      forecastEmissions: forecast,
      aiInsights,
    };
  });
}

