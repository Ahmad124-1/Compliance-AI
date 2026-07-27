import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { surveyRepo } from '../repositories/survey.repo.js';
import { notificationService } from '../services/notification.service.js';
import { aiService } from '../modules/ai/service.js';

export const surveysService = {
  async list(orgId: string, filters: { status?: string; departmentId?: string; siteId?: string } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return surveyRepo.findMany(orgId, filters);
  },

  async get(orgId: string, id: string) {
    const survey = await surveyRepo.findById(orgId, id);
    if (!survey) throw new NotFoundError('Survey not found');
    const responses = await surveyRepo.findResponses(orgId, id);
    const avgScore = responses.map((r) => r.overallScore).filter((s): s is number => s !== null);
    return {
      ...survey,
      responseCount: responses.length,
      avgScore: avgScore.length ? Math.round(avgScore.reduce((a, b) => a + b, 0) / avgScore.length) : 0,
    };
  },

  async create(orgId: string, userId: string | undefined, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const survey = await surveyRepo.create({ organizationId: orgId, createdBy: userId, ...input });
    await notificationService.createNotification({
      organizationId: orgId,
      userId: userId || '',
      type: 'assignment',
      channel: 'in_app',
      title: 'New Survey Created',
      body: `Survey "${survey.title}" has been created.`,
      data: { surveyId: survey.id },
    });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'survey.create', entity: 'survey', entityId: survey.id });
    return survey;
  },

  async update(orgId: string, id: string, userId: string | undefined, patch: any) {
    const survey = await surveyRepo.findById(orgId, id);
    if (!survey) throw new NotFoundError('Survey not found');
    const updated = await surveyRepo.update(orgId, id, patch);
    if (!updated) throw new NotFoundError('Survey update failed');
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'survey.update', entity: 'survey', entityId: id });
    return updated;
  },

  async submitResponse(orgId: string, surveyId: string, userId: string | undefined, answers: Record<string, unknown>, overallScore?: number | null, sentiment?: string | null) {
    const survey = await surveyRepo.findById(orgId, surveyId);
    if (!survey) throw new NotFoundError('Survey not found');
    const response = await surveyRepo.createResponse({ organizationId: orgId, surveyId, userId, answers, overallScore, sentiment });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'survey.response', entity: 'survey_response', entityId: response.id });
    return response;
  },

  async getSurveyAnalytics(orgId: string, surveyId: string) {
    const survey = await surveyRepo.findById(orgId, surveyId);
    if (!survey) throw new NotFoundError('Survey not found');
    const responses = await surveyRepo.findResponses(orgId, surveyId);
    const avgScore = responses.map((r) => r.overallScore).filter((s): s is number => s !== null);
    const sentimentCounts: Record<string, number> = {};
    for (const r of responses) {
      if (r.sentiment) sentimentCounts[r.sentiment] = (sentimentCounts[r.sentiment] || 0) + 1;
    }
    return {
      surveyId,
      totalResponses: responses.length,
      avgScore: avgScore.length ? Math.round(avgScore.reduce((a, b) => a + b, 0) / avgScore.length) : 0,
      sentimentBreakdown: sentimentCounts,
      completionRate: 0,
    };
  },

  async aiSummarize(orgId: string, surveyId: string) {
    const survey = await surveyRepo.findById(orgId, surveyId);
    if (!survey) throw new NotFoundError('Survey not found');
    const responses = await surveyRepo.findResponses(orgId, surveyId);
    const openEnded = responses.flatMap((r) => Object.values(r.answers).filter(Boolean));
    const text = openEnded.slice(0, 50).join('\n');
    try {
      const result = await aiService.analyze({ text: text || 'No open-ended responses yet.', locale: (survey.language as any) || undefined });
      return { summary: (result.summary as any)?.text || 'Summary generated.', sentiment: result.sentiment, recommendations: result.recommendations };
    } catch {
      return { summary: 'AI summarization not available.', sentiment: null, recommendations: [] };
    }
  },
};
