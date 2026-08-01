import { audit } from '../core/audit.js';
import { NotFoundError } from '../core/errors.js';
import { sbtiTargetRepo } from '../repositories/sbti-target.repo.js';
import { emissionRecordRepo } from '../repositories/emission-record.repo.js';
import { ghgScopeRepo } from '../repositories/ghg-scope.repo.js';
import type { SbtiTargetType, SbtiTargetCategory, SbtiScopeCoverage, SbtiPathwayType, SbtiTargetStatus, SbtiMilestoneStatus } from '../types/carbon.js';

export const sbtiService = {
  // ---- Target CRUD ----

  async listTargets(orgId: string, filter: Record<string, unknown> = {}) {
    return sbtiTargetRepo.listByOrganization(orgId, {
      targetType: filter.targetType as SbtiTargetType | undefined,
      status: filter.status as SbtiTargetStatus | undefined,
      facilityId: filter.facilityId as string | undefined,
      scopeCoverage: filter.scopeCoverage as SbtiScopeCoverage | undefined,
    });
  },

  async getTarget(orgId: string, id: string) {
    const target = await sbtiTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('SBTi target not found');
    return target;
  },

  async createTarget(orgId: string, input: Record<string, unknown>, userId?: string) {
    const target = await sbtiTargetRepo.create({
      organizationId: orgId,
      facilityId: input.facilityId as string | undefined,
      scopeId: input.scopeId as string | undefined,
      name: input.name as string,
      description: input.description as string | undefined,
      targetType: input.targetType as SbtiTargetType,
      targetCategory: input.targetCategory as SbtiTargetCategory | undefined,
      baseYear: input.baseYear as number,
      targetYear: input.targetYear as number,
      baseYearEmissionsTco2e: input.baseYearEmissionsTco2e as number,
      targetEmissionsTco2e: input.targetEmissionsTco2e as number,
      currentEmissionsTco2e: input.currentEmissionsTco2e as number | undefined,
      reductionPct: input.reductionPct as number,
      progressPct: input.progressPct as number | undefined,
      scopeCoverage: input.scopeCoverage as SbtiScopeCoverage | undefined,
      pathwayType: input.pathwayType as SbtiPathwayType | undefined,
      status: input.status as SbtiTargetStatus | undefined,
      validationBody: input.validationBody as string | undefined,
      validationDate: input.validationDate as string | undefined,
      validationDocumentUrl: input.validationDocumentUrl as string | undefined,
      milestones: input.milestones as Record<string, unknown>[] | undefined,
      achievedEarly: input.achievedEarly as boolean | undefined,
      isPublic: input.isPublic as boolean | undefined,
    });
    await audit({ action: 'sbti.target.create', entity: 'sbti_target', entityId: target.id, organizationId: orgId, actorId: userId });
    return target;
  },

  async updateTarget(orgId: string, id: string, input: Record<string, unknown>, userId?: string) {
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','targetType','targetCategory','baseYear','targetYear','baseYearEmissionsTco2e','targetEmissionsTco2e','currentEmissionsTco2e','reductionPct','progressPct','scopeCoverage','pathwayType','status','validationBody','validationDate','validationDocumentUrl','milestones','achievedEarly','isPublic'];
    for (const f of fields) {
      if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f];
    }
    const target = await sbtiTargetRepo.update(id, orgId, patch as Parameters<typeof sbtiTargetRepo.update>[2]);
    if (!target) throw new NotFoundError('SBTi target not found');
    await audit({ action: 'sbti.target.update', entity: 'sbti_target', entityId: id, organizationId: orgId, actorId: userId });
    return target;
  },

  async deleteTarget(orgId: string, id: string, userId?: string) {
    const existing = await sbtiTargetRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('SBTi target not found');
    await sbtiTargetRepo.softDelete(id, orgId);
    await audit({ action: 'sbti.target.delete', entity: 'sbti_target', entityId: id, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // ---- Target Workflow ----

  async submitForValidation(orgId: string, id: string, userId?: string) {
    const target = await sbtiTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('SBTi target not found');
    if (target.status !== 'draft') throw new Error('Only draft targets can be submitted for validation');
    const updated = await sbtiTargetRepo.update(id, orgId, { status: 'submitted' });
    await audit({ action: 'sbti.target.submit', entity: 'sbti_target', entityId: id, organizationId: orgId, actorId: userId });
    return updated;
  },

  async validate(orgId: string, id: string, validationBody: string, validationDate: string, documentUrl?: string, userId?: string) {
    const target = await sbtiTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('SBTi target not found');
    if (target.status !== 'submitted' && target.status !== 'validating') throw new Error('Target must be in submitted or validating status');
    const updated = await sbtiTargetRepo.update(id, orgId, {
      status: 'validated',
      validationBody,
      validationDate,
      validationDocumentUrl: documentUrl ?? null,
    });
    await audit({ action: 'sbti.target.validate', entity: 'sbti_target', entityId: id, organizationId: orgId, actorId: userId, metadata: { validationBody, validationDate } });
    return updated;
  },

  async activate(orgId: string, id: string, userId?: string) {
    const target = await sbtiTargetRepo.findById(id, orgId);
    if (!target) throw new NotFoundError('SBTi target not found');
    if (target.status !== 'validated') throw new Error('Only validated targets can be activated');
    const updated = await sbtiTargetRepo.update(id, orgId, { status: 'active' });
    await audit({ action: 'sbti.target.activate', entity: 'sbti_target', entityId: id, organizationId: orgId, actorId: userId });
    return updated;
  },

  // ---- Progress & Analytics ----

  async getProgressStats(orgId: string) {
    return sbtiTargetRepo.getProgressStats(orgId);
  },

  async getDashboard(orgId: string) {
    const targets = await sbtiTargetRepo.listByOrganization(orgId);
    const stats = await sbtiTargetRepo.getProgressStats(orgId);
    const activeTargets = targets.filter(t => t.status === 'active');
    const nearTermTargets = targets.filter(t => t.targetType === 'near_term');
    const longTermTargets = targets.filter(t => t.targetType === 'long_term');
    const netZeroTargets = targets.filter(t => t.targetType === 'net_zero');

    // Calculate expected reduction trajectory
    const pathwayData = activeTargets.map(t => {
      const years: { year: number; targetValue: number; currentValue: number | null }[] = [];
      const currentYear = new Date().getFullYear();
      const totalYears = t.targetYear - t.baseYear;
      for (let y = t.baseYear; y <= t.targetYear; y++) {
        const progress = (y - t.baseYear) / totalYears;
        let targetValue: number;
        switch (t.pathwayType) {
          case 's_curve':
            targetValue = t.baseYearEmissionsTco2e - (t.baseYearEmissionsTco2e - t.targetEmissionsTco2e) * (1 / (1 + Math.exp(-10 * (progress - 0.5))));
            break;
          case 'exponential':
            targetValue = t.baseYearEmissionsTco2e - (t.baseYearEmissionsTco2e - t.targetEmissionsTco2e) * Math.pow(progress, 2);
            break;
          default:
            targetValue = t.baseYearEmissionsTco2e - (t.baseYearEmissionsTco2e - t.targetEmissionsTco2e) * progress;
        }
        years.push({ year: y, targetValue: parseFloat(targetValue.toFixed(2)), currentValue: y <= currentYear ? t.currentEmissionsTco2e : null });
      }
      return { targetId: t.id, name: t.name, years };
    });

    return {
      totalTargets: stats.total,
      activeTargets: stats.active,
      achievedTargets: stats.achieved,
      atRiskTargets: stats.atRisk,
      averageProgress: stats.avgProgress,
      nearTermTargets: nearTermTargets.length,
      longTermTargets: longTermTargets.length,
      netZeroTargets: netZeroTargets.length,
      targetList: targets.map(t => ({
        id: t.id,
        name: t.name,
        targetType: t.targetType,
        baseYear: t.baseYear,
        targetYear: t.targetYear,
        reductionPct: t.reductionPct,
        progressPct: t.progressPct,
        status: t.status,
      })),
      pathwayData,
    };
  },

  async getForecast(orgId: string) {
    const targets = await sbtiTargetRepo.listByOrganization(orgId);
    const records = await emissionRecordRepo.listByOrganization(orgId);

    // Calculate current yearly emissions
    const yearlyEmissions = new Map<number, number>();
    for (const r of records) {
      const year = parseInt(r.emissionDate.slice(0, 4), 10);
      yearlyEmissions.set(year, (yearlyEmissions.get(year) || 0) + Number(r.co2e));
    }

    const currentYear = new Date().getFullYear();
    const forecast: { year: number; projected: number; baseline: number; targetPath: number }[] = [];

    // Get baseline year emissions from the best available target
    const activeTarget = targets.find(t => t.status === 'active');
    const baselineYear = activeTarget?.baseYear || currentYear - 1;
    const baselineEmissions = activeTarget?.baseYearEmissionsTco2e || yearlyEmissions.get(baselineYear) || 0;

    for (let y = baselineYear; y <= currentYear + 10; y++) {
      const actual = yearlyEmissions.get(y);
      const projected = actual || (baselineEmissions * Math.exp(-0.05 * (y - baselineYear))); // default 5% annual reduction
      const targetPath = activeTarget
        ? activeTarget.baseYearEmissionsTco2e - (activeTarget.baseYearEmissionsTco2e - activeTarget.targetEmissionsTco2e) * ((y - activeTarget.baseYear) / (activeTarget.targetYear - activeTarget.baseYear))
        : baselineEmissions * (1 - 0.05 * (y - baselineYear));

      forecast.push({
        year: y,
        projected: parseFloat(projected.toFixed(2)),
        baseline: parseFloat(baselineEmissions.toFixed(2)),
        targetPath: parseFloat(Math.max(0, targetPath).toFixed(2)),
      });
    }

    return forecast;
  },

  // ---- Milestones ----

  async listMilestones(targetId: string) {
    return sbtiTargetRepo.listMilestones(targetId);
  },

  async createMilestone(orgId: string, targetId: string, input: Record<string, unknown>, userId?: string) {
    // Verify target exists
    await this.getTarget(orgId, targetId);
    const milestone = await sbtiTargetRepo.createMilestone({
      sbtiTargetId: targetId,
      name: input.name as string,
      description: input.description as string | undefined,
      milestoneYear: input.milestoneYear as number,
      targetEmissionsTco2e: input.targetEmissionsTco2e as number,
      currentEmissionsTco2e: input.currentEmissionsTco2e as number | undefined,
      status: input.status as SbtiMilestoneStatus | undefined,
      notes: input.notes as string | undefined,
      sortOrder: input.sortOrder as number | undefined,
    });
    await audit({ action: 'sbti.milestone.create', entity: 'sbti_milestone', entityId: milestone.id, organizationId: orgId, actorId: userId });
    return milestone;
  },

  async updateMilestone(orgId: string, targetId: string, milestoneId: string, input: Record<string, unknown>, userId?: string) {
    await this.getTarget(orgId, targetId);
    const patch: Record<string, unknown> = {};
    const fields = ['name','description','milestoneYear','targetEmissionsTco2e','currentEmissionsTco2e','status','notes','sortOrder'];
    for (const f of fields) {
      if ((input as Record<string, unknown>)[f] !== undefined) patch[f] = (input as Record<string, unknown>)[f];
    }
    const milestone = await sbtiTargetRepo.updateMilestone(milestoneId, patch as Parameters<typeof sbtiTargetRepo.updateMilestone>[1]);
    if (!milestone) throw new NotFoundError('Milestone not found');
    await audit({ action: 'sbti.milestone.update', entity: 'sbti_milestone', entityId: milestoneId, organizationId: orgId, actorId: userId });
    return milestone;
  },

  async deleteMilestone(orgId: string, targetId: string, milestoneId: string, userId?: string) {
    await this.getTarget(orgId, targetId);
    await sbtiTargetRepo.deleteMilestone(milestoneId);
    await audit({ action: 'sbti.milestone.delete', entity: 'sbti_milestone', entityId: milestoneId, organizationId: orgId, actorId: userId });
    return { success: true };
  },

  // ---- AI Recommendations ----

  async getAiRecommendations(orgId: string) {
    const targets = await sbtiTargetRepo.listByOrganization(orgId);
    const stats = await sbtiTargetRepo.getProgressStats(orgId);
    const records = await emissionRecordRepo.listByOrganization(orgId);
    const scopes = await ghgScopeRepo.listByOrganization(orgId);

    const totalEmissions = records.reduce((s, r) => s + Number(r.co2e), 0);
    const recommendations: { type: string; priority: string; title: string; description: string }[] = [];

    // Check if organization has SBTi targets
    if (targets.length === 0) {
      recommendations.push({
        type: 'target',
        priority: 'high',
        title: 'Set Science-Based Targets',
        description: 'Your organization has no SBTi targets. Setting near-term and long-term targets aligned with climate science is the first step to credible climate action.',
      });
    }

    // Check if any targets are at risk
    const atRiskTargets = targets.filter(t => t.status === 'at_risk');
    for (const t of atRiskTargets) {
      recommendations.push({
        type: 'alert',
        priority: 'high',
        title: `Target at Risk: ${t.name}`,
        description: `The SBTi target "${t.name}" (${t.targetType}) is at risk with only ${t.progressPct}% progress toward ${t.reductionPct}% reduction by ${t.targetYear}.`,
      });
    }

    // Check scope distribution
    if (scopes.length > 0) {
      const scope3Id = scopes.find(s => s.scopeNumber === 3)?.id;
      if (scope3Id) {
        const scope3Emissions = records.filter(r => r.scopeId === scope3Id).reduce((s, r) => s + Number(r.co2e), 0);
        if (scope3Emissions > 0) {
          const pct = (scope3Emissions / Math.max(1, totalEmissions)) * 100;
          if (pct > 50) {
            recommendations.push({
              type: 'insight',
              priority: 'medium',
              title: 'Scope 3 Emissions Dominant',
              description: `Scope 3 accounts for ${pct.toFixed(1)}% of total emissions. Consider supplier engagement programs to reduce value chain emissions.`,
            });
          }
        }
      }
    }

    // Progress recommendations
    if (stats.avgProgress < 30 && targets.length > 0) {
      recommendations.push({
        type: 'recommendation',
        priority: 'medium',
        title: 'Accelerate Reduction Progress',
        description: `Average progress across all targets is only ${stats.avgProgress.toFixed(1)}%. Consider increasing renewable energy procurement and energy efficiency projects.`,
      });
    }

    // Net zero recommendation
    if (!targets.some(t => t.targetType === 'net_zero' && t.status === 'active')) {
      recommendations.push({
        type: 'recommendation',
        priority: 'low',
        title: 'Set a Net Zero Target',
        description: 'Setting a net-zero target by 2050 aligns with the Paris Agreement and demonstrates long-term climate leadership.',
      });
    }

    return recommendations;
  },
};
