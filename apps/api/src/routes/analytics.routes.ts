import type { FastifyInstance } from 'fastify';

import { analyticsService } from '../services/analytics.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/analytics/cases', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { dateFrom?: string; dateTo?: string; siteId?: string; departmentId?: string };
    return analyticsService.getCaseAnalytics(auth.org, q);
  });

  app.get('/analytics/communication', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { dateFrom?: string; dateTo?: string };
    return analyticsService.getCommunicationAnalytics(auth.org, q);
  });

  app.get('/analytics/sla', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { dateFrom?: string; dateTo?: string };
    return analyticsService.getSlaAnalytics(auth.org, q);
  });

  app.get('/analytics/escalations', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    return analyticsService.getEscalationAnalytics(auth.org);
  });

  app.get('/analytics/qr', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { qrCodeId?: string; dateFrom?: string; dateTo?: string };
    return analyticsService.getQrAnalytics(auth.org, q);
  });

  app.get('/analytics/kpis', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { dateFrom?: string; dateTo?: string };
    return analyticsService.getKpis(auth.org, q);
  });

  app.get('/analytics/trends', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { metric?: string; period?: string };
    return analyticsService.getTrends(auth.org, q.metric ?? 'cases', q.period ?? 'day');
  });

  app.get('/analytics/heatmap', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { metric?: string };
    return analyticsService.getHeatmapData(auth.org, q.metric ?? 'cases');
  });

  app.post('/analytics/refresh', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const { date } = req.body as { date?: string };
    return analyticsService.refreshDailySummaries(auth.org, date);
  });
}
