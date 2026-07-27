import { NotFoundError } from '../core/errors.js';
import { sustainabilityProgramRepo } from '../repositories/sustainability-program.repo.js';
import { esgGoalRepo } from '../repositories/esg-goal.repo.js';
import { sustainabilityKpiRepo } from '../repositories/sustainability-kpi.repo.js';
import { sustainabilityInitiativeRepo } from '../repositories/sustainability-initiative.repo.js';
import { kpiMeasurementRepo } from '../repositories/kpi-measurement.repo.js';
import { sdgMappingRepo } from '../repositories/sdg-mapping.repo.js';

export const sustainabilityAnalyticsService = {
  async getDashboard(orgId: string) {
    const programs = await sustainabilityProgramRepo.listByOrganization(orgId);
    const activePrograms = programs.filter((p) => p.status === 'active').length;
    const goals = await esgGoalRepo.listByOrganization(orgId);
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId);
    const initiatives = await sustainabilityInitiativeRepo.listByOrganization(orgId);
    const esgPillarDistribution = { environment: 0, social: 0, governance: 0 };
    for (const g of goals) {
      esgPillarDistribution[g.esgPillar]++;
    }
    const sdgContribution = await sdgMappingRepo.getSdgContribution(orgId);
    const progressPct = goals.length ? Math.round(goals.filter((g) => g.status === 'achieved').length / goals.length * 100) : 0;
    const atRiskKpis = await Promise.all(
      kpis.map(async (k) => {
        const latest = await kpiMeasurementRepo.getLatest(k.id, orgId);
        if (latest && k.thresholdCritical && latest.value >= k.thresholdCritical) return true;
        return false;
      }),
    );
    return {
      totalPrograms: programs.length,
      activePrograms,
      totalGoals: goals.length,
      achievedGoals: goals.filter((g) => g.status === 'achieved').length,
      goalsInProgress: goals.filter((g) => g.status === 'in_progress').length,
      totalKpis: kpis.length,
      kpisAtRisk: atRiskKpis.filter(Boolean).length,
      totalInitiatives: initiatives.length,
      initiativesCompleted: initiatives.filter((i) => i.status === 'completed').length,
      initiativesOnTrack: initiatives.filter((i) => i.status === 'active').length,
      esgPillarDistribution,
      sdgContribution,
      progressPct,
    };
  },

  async getProgramProgress(orgId: string, programId: string) {
    const program = await sustainabilityProgramRepo.findById(programId, orgId);
    if (!program) throw new NotFoundError('Program not found');
    const goals = await esgGoalRepo.listByOrganization(orgId, { programId });
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId, { programId });
    const initiatives = await sustainabilityInitiativeRepo.listByOrganization(orgId, { programId });
    return { program, goals, kpis, initiatives };
  },

  async getGoalCompletion(orgId: string) {
    return esgGoalRepo.getProgress(orgId);
  },

  async getKpiTrends(orgId: string, kpiId: string, fromDate: string, toDate: string) {
    return kpiMeasurementRepo.getTrend(kpiId, orgId, fromDate, toDate);
  },

  async getInitiativePerformance(orgId: string) {
    return sustainabilityInitiativeRepo.listByOrganization(orgId);
  },

  async getDepartmentComparison(orgId: string) {
    const kpis = await sustainabilityKpiRepo.listByOrganization(orgId, { departmentId: undefined });
    const depts = new Map<string, number[]>();
    for (const kpi of kpis) {
      if (kpi.departmentId) {
        if (!depts.has(kpi.departmentId)) depts.set(kpi.departmentId, []);
        const latest = await kpiMeasurementRepo.getLatest(kpi.id, orgId);
        if (latest) depts.get(kpi.departmentId)!.push(latest.value);
      }
    }
    const result: Record<string, { avg: number; count: number }> = {};
    for (const [dept, values] of depts) {
      result[dept] = {
        avg: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
        count: values.length,
      };
    }
    return result;
  },

  async getEsgPillarDistribution(orgId: string) {
    const goals = await esgGoalRepo.listByOrganization(orgId);
    const distribution = { environment: 0, social: 0, governance: 0 };
    for (const g of goals) {
      distribution[g.esgPillar]++;
    }
    return distribution;
  },

  async getSdgContribution(orgId: string) {
    return sdgMappingRepo.getSdgContribution(orgId);
  },
};