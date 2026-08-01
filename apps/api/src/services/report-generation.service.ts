import { carbonReportRepo } from '../repositories/carbon-report.repo.js';
import { emissionRecordRepo } from '../repositories/emission-record.repo.js';
import { ghgScopeRepo } from '../repositories/ghg-scope.repo.js';
import { facilityRepo } from '../repositories/facility.repo.js';
import { carbonProjectRepo } from '../repositories/carbon-project.repo.js';
import { carbonOffsetRepo } from '../repositories/carbon-offset.repo.js';
import { reductionTargetRepo } from '../repositories/reduction-target.repo.js';
import { sbtiTargetRepo } from '../repositories/sbti-target.repo.js';
import { audit } from '../core/audit.js';
import type { CarbonReportType, ReportFormat } from '../types/carbon.js';

export const reportGenerationService = {
  async generateReport(
    orgId: string,
    reportId: string,
    format: ReportFormat,
    userId?: string,
  ): Promise<{ fileUrl: string; summary: string; chartData: Record<string, unknown> }> {
    const report = await carbonReportRepo.findById(reportId, orgId);
    if (!report) throw new Error('Report not found');

    // Gather report data based on report type
    const reportData = await this.gatherReportData(orgId, report.reportType, report.params || {});
    const chartData = this.buildChartData(reportData);
    const summary = this.buildExecutiveSummary(reportData, report.reportType);

    // Generate file (simulated - in production would use PDF/Excel library)
    const fileUrl = `/reports/${orgId}/${reportId}.${format}`;

    // Update report record
    await carbonReportRepo.update(reportId, orgId, {
      status: 'generated',
      fileUrl,
      summary,
      ...(report.params ? { params: { ...report.params as Record<string, unknown>, chartData } } : {}),
    });

    await audit({
      action: 'report.generate',
      entity: 'carbon_report',
      entityId: reportId,
      organizationId: orgId,
      actorId: userId,
      metadata: { format, reportType: report.reportType },
    });

    return { fileUrl, summary, chartData };
  },

  async gatherReportData(orgId: string, reportType: CarbonReportType, params: Record<string, unknown>) {
    const records = await emissionRecordRepo.listByOrganization(orgId);
    const scopes = await ghgScopeRepo.listByOrganization(orgId);
    const facilities = await facilityRepo.listByOrganization(orgId);
    const projects = await carbonProjectRepo.listByOrganization(orgId);
    const offsets = await carbonOffsetRepo.listByOrganization(orgId);
    const targets = await reductionTargetRepo.listByOrganization(orgId);

    const totalEmissions = records.reduce((s, r) => s + Number(r.co2e), 0);
    const scope1Id = scopes.find(s => s.scopeNumber === 1)?.id;
    const scope2Id = scopes.find(s => s.scopeNumber === 2)?.id;
    const scope3Id = scopes.find(s => s.scopeNumber === 3)?.id;

    const scope1Emissions = records.filter(r => r.scopeId === scope1Id).reduce((s, r) => s + Number(r.co2e), 0);
    const scope2Emissions = records.filter(r => r.scopeId === scope2Id).reduce((s, r) => s + Number(r.co2e), 0);
    const scope3Emissions = records.filter(r => r.scopeId === scope3Id).reduce((s, r) => s + Number(r.co2e), 0);

    // Monthly breakdown
    const monthlyMap = new Map<string, number>();
    for (const r of records) {
      const month = r.emissionDate.slice(0, 7);
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(r.co2e));
    }
    const monthlyEmissions = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, co2e]) => ({ month, co2e: parseFloat(co2e.toFixed(2)) }));

    // Facility comparison
    const facilityEmissions = new Map<string, number>();
    for (const r of records) {
      if (r.facilityId) {
        const fac = facilities.find(f => f.id === r.facilityId);
        if (fac) facilityEmissions.set(fac.name, (facilityEmissions.get(fac.name) || 0) + Number(r.co2e));
      }
    }
    const facilityComparison = Array.from(facilityEmissions.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, val]) => ({ name, emissions: parseFloat(val.toFixed(2)) }));

    const baseData = {
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      scope1Emissions: parseFloat(scope1Emissions.toFixed(2)),
      scope2Emissions: parseFloat(scope2Emissions.toFixed(2)),
      scope3Emissions: parseFloat(scope3Emissions.toFixed(2)),
      scope1Pct: totalEmissions > 0 ? parseFloat(((scope1Emissions / totalEmissions) * 100).toFixed(1)) : 0,
      scope2Pct: totalEmissions > 0 ? parseFloat(((scope2Emissions / totalEmissions) * 100).toFixed(1)) : 0,
      scope3Pct: totalEmissions > 0 ? parseFloat(((scope3Emissions / totalEmissions) * 100).toFixed(1)) : 0,
      totalFacilities: facilities.length,
      activeFacilities: facilities.filter(f => f.isActive).length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalOffsets: offsets.length,
      totalCreditsPurchased: offsets.reduce((s, o) => s + Number(o.creditsPurchased), 0),
      totalCreditsRetired: offsets.reduce((s, o) => s + Number(o.creditsRetired), 0),
      totalTargets: targets.length,
      achievedTargets: targets.filter(t => t.status === 'achieved').length,
      monthlyEmissions,
      facilityComparison,
      generatedAt: new Date().toISOString(),
    };

    if (reportType === 'sbti_report') {
      const sbtiTargets = await sbtiTargetRepo.listByOrganization(orgId);
      const sbtiStats = await sbtiTargetRepo.getProgressStats(orgId);
      return {
        ...baseData,
        sbtiTargets: sbtiTargets.map(t => ({
          name: t.name,
          type: t.targetType,
          baseYear: t.baseYear,
          targetYear: t.targetYear,
          reductionPct: t.reductionPct,
          progressPct: t.progressPct,
          status: t.status,
        })),
        sbtiStats,
      };
    }

    return baseData;
  },

  buildChartData(data: Record<string, unknown>): Record<string, unknown> {
    return {
      scopeDistribution: [
        { name: 'Scope 1', value: data.scope1Emissions || 0 },
        { name: 'Scope 2', value: data.scope2Emissions || 0 },
        { name: 'Scope 3', value: data.scope3Emissions || 0 },
      ],
      monthlyTrend: data.monthlyEmissions || [],
      facilityRanking: data.facilityComparison || [],
      reductionProgress: {
        achieved: data.achievedTargets || 0,
        total: data.totalTargets || 0,
        pct: data.totalTargets ? Math.round(((data.achievedTargets as number) / (data.totalTargets as number)) * 100) : 0,
      },
    };
  },

  buildExecutiveSummary(data: Record<string, unknown>, reportType: CarbonReportType): string {
    const total = data.totalEmissions as number || 0;
    const s1 = data.scope1Emissions as number || 0;
    const s2 = data.scope2Emissions as number || 0;
    const s3 = data.scope3Emissions as number || 0;

    const reportNames: Record<string, string> = {
      carbon_inventory: 'Carbon Inventory Report',
      ghg_inventory: 'GHG Inventory Report',
      emission_summary: 'Emission Summary Report',
      scope_report: 'Scope Analysis Report',
      facility_report: 'Facility Report',
      project_report: 'Carbon Projects Report',
      reduction_report: 'Emission Reduction Report',
      executive_report: 'Executive Carbon Report',
      cdp_report: 'CDP Report',
      sbti_report: 'SBTi Progress Report',
    };

    const scopeBreakdown = `Scope 1: ${s1.toLocaleString()} tCO2e, Scope 2: ${s2.toLocaleString()} tCO2e, Scope 3: ${s3.toLocaleString()} tCO2e`;
    const summary = `${reportNames[reportType] || 'Carbon Report'} — Total emissions: ${total.toLocaleString()} tCO2e. ${scopeBreakdown}. Generated on ${new Date().toISOString().split('T')[0]}.`;

    return summary;
  },
};
