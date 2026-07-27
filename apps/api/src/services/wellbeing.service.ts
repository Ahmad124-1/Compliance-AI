import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { wellbeingRepo } from '../repositories/wellbeing.repo.js';
import { engagementRepo } from '../repositories/engagement.repo.js';

export const wellbeingService = {
  async selfAssess(orgId: string, userId: string, assessmentType: string, scores: Record<string, unknown>, indicators?: any[]) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const numericScores = Object.values(scores).filter((v): v is number => typeof v === 'number');
    const overall = numericScores.length ? Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length) : 0;
    const tips = indicators && indicators.some((i: any) => i.level === 'high')
      ? ['Take a short break', 'Speak to your manager', 'Use the employee assistance program']
      : ['Keep up the good work', 'Stay hydrated', 'Maintain work-life balance'];
    const assessment = await wellbeingRepo.create({ organizationId: orgId, userId, assessmentType, scores, indicators: indicators ?? [], tips, overallWellbeingScore: overall });
    const today = new Date().toISOString().slice(0, 10);
    await engagementRepo.upsertDailyScore(orgId, userId, today, {
      wellbeingScore: overall,
      moraleScore: (scores as any).morale ?? overall,
      dataSources: { wellbeing: true, source: assessmentType },
    });
    await audit({ organizationId: orgId, actorId: userId, action: 'wellbeing.assess', entity: 'wellbeing_assessment', entityId: assessment.id });
    return assessment;
  },

  async getMyAssessments(orgId: string, userId: string, filters: { assessmentType?: string; dateFrom?: string; dateTo?: string } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return wellbeingRepo.findAssessments(orgId, userId, filters.assessmentType, filters.dateFrom, filters.dateTo);
  },

  async getWellbeingTips(orgId: string, topic?: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return wellbeingRepo.findTips(orgId, topic);
  },

  async getCheckinHistory(orgId: string, userId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return wellbeingRepo.findAssessments(orgId, userId);
  },

  async detectBurnoutRisk(orgId: string, userId: string) {
    const assessments = await wellbeingRepo.findAssessments(orgId, userId, 'daily', undefined, undefined);
    const recent = assessments.slice(0, 7);
    if (recent.length < 3) return { risk: 'low', score: 0, factors: ['Insufficient data — keep checking in'] };
    const scores = recent.map((a) => a.overallWellbeingScore || 0);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0;
    const risk = avg < 40 ? 'high' : avg < 60 ? 'medium' : 'low';
    const factors: string[] = [];
    if (trend < -10) factors.push('Declining wellbeing trend');
    if (avg < 50) factors.push('Below average wellbeing score');
    if (recent.filter((a) => (a.overallWellbeingScore || 0) < 40).length >= 2) factors.push('Multiple low scores this week');
    return { risk, score: Math.round(avg), factors, recentAssessments: recent };
  },
};
