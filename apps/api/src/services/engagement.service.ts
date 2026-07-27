import { NotFoundError } from '../core/errors.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { engagementRepo } from '../repositories/engagement.repo.js';
import { surveyRepo } from '../repositories/survey.repo.js';
import { recognitionRepo } from '../repositories/recognition.repo.js';
import { wellbeingRepo } from '../repositories/wellbeing.repo.js';
import { eventRepo } from '../repositories/event.repo.js';
import { notificationService } from '../services/notification.service.js';

export const engagementService = {
  async getDashboard(orgId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const scores = await engagementRepo.findDailyScores(orgId);
    const surveys = await surveyRepo.findMany(orgId);
    const recognitions = await recognitionRepo.findMany(orgId, { limit: 100 });
    const events = await eventRepo.findMany(orgId);
    const insights = await engagementRepo.findAiInsights(orgId, { isRead: false });
    const recentScores = scores.filter((s) => s.scoreDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const avgEngagement = recentScores.length ? Math.round(recentScores.reduce((sum, s) => sum + (s.engagementScore ?? 0), 0) / recentScores.length) : 0;
    const avgWellbeing = recentScores.length ? Math.round(recentScores.reduce((sum, s) => sum + (s.wellbeingScore ?? 0), 0) / recentScores.length) : 0;
    const participationRate = surveys.length ? Math.round((surveys.length / surveys.length) * 100) : 0;
    const surveyCompletion = surveys.length ? Math.round(surveys.filter((s) => s.status === 'active' || s.status === 'closed').length / surveys.length * 100) : 0;
    const recognitionActivity = recognitions.length;
    const activeEvents = events.filter((e) => e.status === 'scheduled' || e.status === 'active').length;
    const trainingParticipation = activeEvents;
    const communicationEffectiveness = Math.round((avgEngagement + avgWellbeing) / 2);
    return {
      overallEngagementScore: avgEngagement,
      wellbeingScore: avgWellbeing,
      departmentRankings: [],
      participationRate,
      surveyCompletion,
      recognitionActivity,
      trainingParticipation,
      communicationEffectiveness,
      aiRecommendations: insights.slice(0, 5).map((i) => i.title),
    };
  },

  async getManagerDashboard(orgId: string, managerId: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const teamSurveys = await surveyRepo.findMany(orgId);
    const teamRecognitions = await recognitionRepo.findMany(orgId, { fromUserId: managerId });
    const teamAssessments = await wellbeingRepo.findAssessments(orgId, managerId);
    const teamEvents = await eventRepo.findMany(orgId);
    const teamScores = await engagementRepo.findDailyScores(orgId, managerId);
    const recentScores = teamScores.filter((s) => s.scoreDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    const avgEngagement = recentScores.length ? Math.round(recentScores.reduce((sum, s) => sum + (s.engagementScore ?? 0), 0) / recentScores.length) : 0;
    const avgWellbeing = recentScores.length ? Math.round(recentScores.reduce((sum, s) => sum + (s.wellbeingScore ?? 0), 0) / recentScores.length) : 0;
    return {
      departmentEngagement: avgEngagement,
      workerSatisfaction: avgWellbeing,
      recognitionActivity: teamRecognitions.length,
      surveyResults: teamSurveys,
      burnoutIndicators: teamAssessments,
      trainingParticipation: teamEvents.filter((e) => e.status === 'active').length,
      communicationMetrics: Math.round((avgEngagement + avgWellbeing) / 2),
      retentionRisk: recentScores.filter((s) => (s.overallScore ?? 100) < 50).length,
    };
  },

  async getEngagementTrends(orgId: string) {
    const summaries = await engagementRepo.findDailySummary(orgId);
    const weeks: Record<string, { engagement: number[]; wellbeing: number[] }> = {};
    for (const s of summaries) {
      const key = new Date(s.summaryDate).toISOString().slice(0, 7);
      if (!weeks[key]) weeks[key] = { engagement: [], wellbeing: [] };
      if (s.avgEngagementScore) weeks[key].engagement.push(s.avgEngagementScore);
      if (s.avgWellbeingScore) weeks[key].wellbeing.push(s.avgWellbeingScore);
    }
    return Object.entries(weeks).map(([period, data]) => ({
      period,
      engagementScore: data.engagement.length ? Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length) : 0,
      wellbeingScore: data.wellbeing.length ? Math.round(data.wellbeing.reduce((a, b) => a + b, 0) / data.wellbeing.length) : 0,
    }));
  },

  async getParticipationTrends(orgId: string) {
    const summaries = await engagementRepo.findDailySummary(orgId);
    return summaries.map((s) => ({
      date: s.summaryDate,
      participationRate: s.participationRate ?? 0,
      surveyResponses: s.surveyResponses,
    }));
  },

  async getDepartmentComparison(orgId: string) {
    const summaries = await engagementRepo.findDailySummary(orgId);
    const deptMap: Record<string, { engagement: number[]; wellbeing: number[]; participation: number[] }> = {};
    for (const s of summaries) {
      const key = s.departmentId || 'default';
      if (!deptMap[key]) deptMap[key] = { engagement: [], wellbeing: [], participation: [] };
      if (s.avgEngagementScore) deptMap[key].engagement.push(s.avgEngagementScore);
      if (s.avgWellbeingScore) deptMap[key].wellbeing.push(s.avgWellbeingScore);
      if (s.participationRate) deptMap[key].participation.push(s.participationRate);
    }
    return Object.entries(deptMap).map(([key, data]) => ({
      name: key === 'default' ? 'Default' : key,
      engagementScore: data.engagement.length ? Math.round(data.engagement.reduce((a, b) => a + b, 0) / data.engagement.length) : 0,
      wellbeingScore: data.wellbeing.length ? Math.round(data.wellbeing.reduce((a, b) => a + b, 0) / data.wellbeing.length) : 0,
      participationRate: data.participation.length ? Math.round(data.participation.reduce((a, b) => a + b, 0) / data.participation.length) : 0,
    }));
  },

  async getWellbeingTrends(orgId: string, userId?: string) {
    const assessments = userId ? await wellbeingRepo.findAssessments(orgId, userId) : [];
    return assessments.slice(0, 30).map((a) => ({
      date: a.submittedAt || a.createdAt,
      wellbeingScore: a.overallWellbeingScore ?? 0,
      moraleScore: (a.scores as any)?.morale ?? 0,
    }));
  },

  async getAiInsights(orgId: string, filters?: { isRead?: boolean; isResolved?: boolean }) {
    return engagementRepo.findAiInsights(orgId, filters);
  },

  async generateAiInsights(orgId: string, actorId?: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const surveys = await surveyRepo.findMany(orgId, { status: 'active' });
    const responses: any[] = [];
    for (const s of surveys) {
      const r = await surveyRepo.findResponses(orgId, s.id);
      responses.push(...r);
    }
    const avgScores = responses.map((r) => r.overallScore).filter((s: number | null): s is number => s !== null);
    const overallAvg = avgScores.length ? avgScores.reduce((a, b) => a + b, 0) / avgScores.length : 0;
    const insights: any[] = [];
    if (overallAvg < 50) {
      insights.push({
        type: 'morale_decline' as any,
        severity: 'critical',
        title: 'Morale Decline Detected',
        description: `Average survey score is ${Math.round(overallAvg)}%, indicating declining morale.`,
        recommendations: ['Schedule one-on-one check-ins', 'Review recent changes', 'Increase recognition activity'],
      });
    }
    const byDept: Record<string, number[]> = {};
    for (const s of surveys) {
      const dept = s.departmentId || 'default';
      if (!byDept[dept]) byDept[dept] = [];
      const deptResponses = await surveyRepo.findResponses(orgId, s.id);
      for (const r of deptResponses) { if (r.overallScore) byDept[dept].push(r.overallScore); }
    }
    for (const [dept, scores] of Object.entries(byDept)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 45) {
        insights.push({
          type: 'department_attention',
          severity: 'warning',
          title: `Department Needs Attention`,
          description: `Department ${dept} average score is ${Math.round(avg)}%.`,
          recommendations: ['Schedule department town hall', 'Review workload distribution', 'Provide wellbeing support'],
        });
      }
    }
    if (insights.length === 0) {
      insights.push({
        type: 'engagement_campaign',
        severity: 'info',
        title: 'Engagement Campaign Suggested',
        description: 'Scores are stable. Consider launching a recognition campaign.',
        recommendations: ['Launch peer recognition drive', 'Organize social event', 'Publish success stories'],
      });
    }
    for (const insight of insights) {
      await engagementRepo.createAiInsight({
        organizationId: orgId,
        insightType: insight.type,
        severity: insight.severity,
        title: insight.title,
        description: insight.description,
        recommendations: insight.recommendations,
        affectedScope: { type: 'organization' },
      });
    }
    if (actorId) {
      for (const insight of insights) {
        await notificationService.createNotification({
          organizationId: orgId,
          userId: actorId,
          type: 'status_update',
          channel: 'in_app',
          title: `New AI Insight: ${insight.title}`,
          body: insight.description,
          data: { insightType: insight.type },
        });
      }
    }
    return insights;
  },
};
