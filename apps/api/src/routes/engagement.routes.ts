import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { engagementService } from '../services/engagement.service.js';
import { surveysService } from '../services/surveys.service.js';
import { recognitionService } from '../services/recognition.service.js';
import { wellbeingService } from '../services/wellbeing.service.js';
import { communityService } from '../services/community.service.js';
import { eventsService } from '../services/events.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const surveyCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  surveyType: z.string().default('pulse'),
  questions: z.array(z.any()).default([]),
  isAnonymous: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  recurrenceInterval: z.string().optional(),
  targetAudience: z.record(z.any()).default({}),
  departmentId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  language: z.string().default('en'),
  scheduledAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const surveyUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  questions: z.array(z.any()).optional(),
  isAnonymous: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceInterval: z.string().optional(),
  targetAudience: z.record(z.any()).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  language: z.string().optional(),
  scheduledAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const responseSchema = z.object({
  answers: z.record(z.any()),
  overallScore: z.number().nullable().optional(),
  sentiment: z.string().nullable().optional(),
});

const recognitionTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().default('peer'),
  iconUrl: z.string().nullable().optional(),
  pointsValue: z.number().default(0),
  isActive: z.boolean().default(true),
});

const recognitionSchema = z.object({
  recognitionTypeId: z.string().uuid().nullable().optional(),
  toUserId: z.string().uuid(),
  message: z.string().min(1),
  isManagerRecognition: z.boolean().default(false),
  category: z.string().default('peer'),
});

const postSchema = z.object({
  postType: z.string().default('discussion'),
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isAnonymous: z.boolean().default(false),
});

const commentSchema = z.object({
  body: z.string().min(1),
  parentCommentId: z.string().uuid().nullable().optional(),
  isAnonymous: z.boolean().default(false),
});

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.string().default('training'),
  category: z.string().default('general'),
  location: z.string().optional(),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  startAt: z.string(),
  endAt: z.string().nullable().optional(),
  isAllDay: z.boolean().default(false),
  maxAttendees: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

const assessmentSchema = z.object({
  assessmentType: z.string().default('checkin'),
  scores: z.record(z.any()),
  indicators: z.array(z.any()).optional(),
});

export async function engagementRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Engagement Dashboard
  app.get('/engagement/dashboard', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.getDashboard(auth.org);
  });

  app.get('/engagement/manager/dashboard', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.getManagerDashboard(auth.org, auth.sub);
  });

  app.get('/engagement/trends', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.getEngagementTrends(auth.org);
  });

  app.get('/engagement/participation/trends', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.getParticipationTrends(auth.org);
  });

  app.get('/engagement/departments/comparison', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.getDepartmentComparison(auth.org);
  });

  app.get('/engagement/wellbeing/trends', { preHandler: requirePermission('wellbeing:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return engagementService.getWellbeingTrends(auth.org, q.userId);
  });

  app.get('/engagement/ai/insights', { preHandler: requirePermission('engagement:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | boolean | undefined>;
    return engagementService.getAiInsights(auth.org, { isRead: q.isRead === 'true' ? true : q.isRead === 'false' ? false : undefined, isResolved: q.isResolved === 'true' ? true : q.isResolved === 'false' ? false : undefined });
  });

  app.post('/engagement/ai/insights/generate', { preHandler: requirePermission('engagement:update') }, async (req) => {
    const auth = getAuth(req);
    return engagementService.generateAiInsights(auth.org, auth.sub);
  });

  // Surveys
  app.get('/surveys', { preHandler: requirePermission('survey:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return surveysService.list(auth.org, { status: q.status, departmentId: q.departmentId, siteId: q.siteId });
  });

  app.post('/surveys', { preHandler: requirePermission('survey:create'), schema: { body: surveyCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof surveyCreateSchema>;
    return surveysService.create(auth.org, auth.sub, body);
  });

  app.get('/surveys/:id', { preHandler: requirePermission('survey:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return surveysService.get(auth.org, id);
  });

  app.patch('/surveys/:id', { preHandler: requirePermission('survey:update'), schema: { body: surveyUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof surveyUpdateSchema>;
    return surveysService.update(auth.org, id, auth.sub, body);
  });

  app.post('/surveys/:id/respond', { preHandler: requirePermission('survey:create'), schema: { body: responseSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof responseSchema>;
    return surveysService.submitResponse(auth.org, id, auth.sub, body.answers, body.overallScore, body.sentiment);
  });

  app.get('/surveys/:id/analytics', { preHandler: requirePermission('survey:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return surveysService.getSurveyAnalytics(auth.org, id);
  });

  app.post('/surveys/:id/ai-summarize', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return surveysService.aiSummarize(auth.org, id);
  });

  // Recognition
  app.get('/recognition/types', { preHandler: requirePermission('recognition:read') }, async (req) => {
    const auth = getAuth(req);
    return recognitionService.listTypes(auth.org);
  });

  app.post('/recognition/types', { preHandler: requirePermission('recognition:update'), schema: { body: recognitionTypeSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof recognitionTypeSchema>;
    return recognitionService.createType(auth.org, auth.sub, body);
  });

  app.patch('/recognition/types/:id', { preHandler: requirePermission('recognition:update'), schema: { body: recognitionTypeSchema.partial() } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Partial<z.infer<typeof recognitionTypeSchema>>;
    return recognitionService.updateType(auth.org, id, auth.sub, body);
  });

  app.get('/recognition', { preHandler: requirePermission('recognition:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return recognitionService.listRecognitions(auth.org, { toUserId: q.toUserId, fromUserId: q.fromUserId, category: q.category, limit: q.limit ? Number(q.limit) : undefined });
  });

  app.post('/recognition', { preHandler: requirePermission('recognition:create'), schema: { body: recognitionSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof recognitionSchema>;
    return recognitionService.create(auth.org, auth.sub, body);
  });

  app.get('/recognition/leaderboard', { preHandler: requirePermission('recognition:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return recognitionService.getLeaderboard(auth.org, q.period || 'month', q.siteId, q.departmentId);
  });

  app.get('/recognition/history', { preHandler: requirePermission('recognition:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return recognitionService.getRecognitionHistory(auth.org, q.userId || auth.sub);
  });

  app.get('/recognition/my-points', { preHandler: requirePermission('recognition:read') }, async (req) => {
    const auth = getAuth(req);
    return recognitionService.getMyPoints(auth.org, auth.sub);
  });

  // Wellbeing
  app.get('/wellbeing/assessments', { preHandler: requirePermission('wellbeing:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return wellbeingService.getMyAssessments(auth.org, auth.sub, { assessmentType: q.assessmentType, dateFrom: q.dateFrom, dateTo: q.dateTo });
  });

  app.post('/wellbeing/assessments', { preHandler: requirePermission('wellbeing:update'), schema: { body: assessmentSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof assessmentSchema>;
    return wellbeingService.selfAssess(auth.org, auth.sub, body.assessmentType, body.scores, body.indicators);
  });

  app.get('/wellbeing/tips', { preHandler: requirePermission('wellbeing:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return wellbeingService.getWellbeingTips(auth.org, q.topic);
  });

  app.get('/wellbeing/checkin/history', { preHandler: requirePermission('wellbeing:read') }, async (req) => {
    const auth = getAuth(req);
    return wellbeingService.getCheckinHistory(auth.org, auth.sub);
  });

  app.get('/wellbeing/burnout-risk', { preHandler: requirePermission('wellbeing:read') }, async (req) => {
    const auth = getAuth(req);
    return wellbeingService.detectBurnoutRisk(auth.org, auth.sub);
  });

  // Community
  app.get('/community/posts', { preHandler: requirePermission('community:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return communityService.listPosts(auth.org, { postType: q.postType, category: q.category, limit: q.limit ? Number(q.limit) : undefined });
  });

  app.post('/community/posts', { preHandler: requirePermission('community:create'), schema: { body: postSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof postSchema>;
    return communityService.createPost(auth.org, auth.sub, body);
  });

  app.get('/community/posts/:id', { preHandler: requirePermission('community:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return communityService.getPost(auth.org, id);
  });

  app.patch('/community/posts/:id', { preHandler: requirePermission('community:update'), schema: { body: postSchema.partial() } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Partial<z.infer<typeof postSchema>>;
    return communityService.updatePost(auth.org, id, auth.sub, body);
  });

  app.delete('/community/posts/:id', { preHandler: requirePermission('community:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const result = await communityService.deletePost(auth.org, id, auth.sub);
    return { success: result };
  });

  app.get('/community/posts/:id/comments', { preHandler: requirePermission('community:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return communityService.listComments(auth.org, id);
  });

  app.post('/community/posts/:id/comments', { preHandler: requirePermission('community:create'), schema: { body: commentSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof commentSchema>;
    return communityService.createComment(auth.org, id, auth.sub, body);
  });

  app.post('/community/posts/:id/like', { preHandler: requirePermission('community:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return communityService.likePost(auth.org, id, auth.sub);
  });

  // Events
  app.get('/events', { preHandler: requirePermission('event:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    return eventsService.list(auth.org, { eventType: q.eventType, status: q.status, siteId: q.siteId, departmentId: q.departmentId, dateFrom: q.dateFrom, dateTo: q.dateTo });
  });

  app.post('/events', { preHandler: requirePermission('event:create'), schema: { body: eventSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof eventSchema>;
    return eventsService.create(auth.org, auth.sub, body);
  });

  app.get('/events/:id', { preHandler: requirePermission('event:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return eventsService.get(auth.org, id);
  });

  app.patch('/events/:id', { preHandler: requirePermission('event:update'), schema: { body: eventSchema.partial() } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Partial<z.infer<typeof eventSchema>>;
    return eventsService.update(auth.org, id, auth.sub, body);
  });

  app.post('/events/:id/register', { preHandler: requirePermission('event:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { rsvpStatus?: string };
    return eventsService.register(auth.org, id, auth.sub, body.rsvpStatus || 'accepted');
  });

  app.post('/events/:id/sign-in', { preHandler: requirePermission('event:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return eventsService.signIn(auth.org, id, auth.sub);
  });

  app.post('/events/:id/sign-out', { preHandler: requirePermission('event:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return eventsService.signOut(auth.org, id, auth.sub);
  });

  app.get('/events/:id/attendance', { preHandler: requirePermission('event:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return eventsService.getAttendance(auth.org, id);
  });

  app.get('/events/:id/stats', { preHandler: requirePermission('event:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return eventsService.getStats(auth.org, id);
  });
}
