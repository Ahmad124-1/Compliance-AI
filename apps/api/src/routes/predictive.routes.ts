import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from '../routes/guard.js';
import {
  predictionService,
  riskEngineService,
  trendAnalysisService,
  scenarioEngineService,
  recommendationEngineService,
  forecastingService,
} from '../modules/predictive/index.js';

export async function predictiveRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  const predictionQuery = z.object({
    type: z.string().optional(),
    category: z.string().optional(),
    riskLevel: z.string().optional(),
    limit: z.coerce.number().int().optional(),
    offset: z.coerce.number().int().optional(),
  });

  app.get('/predictions', { preHandler: requirePermission('ai:read'), schema: { querystring: predictionQuery } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as z.infer<typeof predictionQuery>;
    const result = await predictionService.list(auth.org, q);
    return result;
  });

  app.post('/predictions', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    type: z.string().min(1), category: z.string().min(1), entityType: z.string().min(1), entityId: z.string().uuid().optional(),
    title: z.string().min(1), description: z.string().optional(), probability: z.number().min(0).max(100),
    confidenceScore: z.number().min(0).max(100), reasoning: z.string().optional(), suggestedActions: z.array(z.string()).optional(),
    riskLevel: z.string().optional(), timeframe: z.string().optional(), metadata: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return predictionService.create({ organizationId: auth.org, ...body }, auth.sub);
  });

  app.get('/predictions/stats', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return predictionService.getStats(auth.org);
  });

  // Risk Forecast
  const riskForecastQuery = z.object({ timeframe: z.string().optional() });
  app.get('/risk/forecast', { preHandler: requirePermission('ai:read'), schema: { querystring: riskForecastQuery } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as z.infer<typeof riskForecastQuery>;
    return riskEngineService.forecastRisks(auth.org, q.timeframe);
  });

  app.post('/risk/audit-prediction', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    auditId: z.string().uuid().optional(), departmentId: z.string().uuid().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return riskEngineService.predictAuditFailure(auth.org, body.auditId, body.departmentId);
  });

  // Trends
  const trendsQuery = z.object({ metric: z.string().optional(), period: z.string().optional() });
  app.get('/trends', { preHandler: requirePermission('ai:read'), schema: { querystring: trendsQuery } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as z.infer<typeof trendsQuery>;
    if (q.metric) {
      return trendAnalysisService.getTrends(auth.org, q.metric as any, q.period);
    }
    return trendAnalysisService.getComplianceTrends(auth.org);
  });

  app.get('/trends/departments', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return trendAnalysisService.getDepartmentTrends(auth.org);
  });

  app.get('/trends/factories', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return trendAnalysisService.getFactoryComparison(auth.org);
  });

  // Scenario
  app.post('/scenario', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    name: z.string().min(1), description: z.string().optional(), scenarioType: z.string().min(1),
    parameters: z.record(z.any()), createdBy: z.string().uuid().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return scenarioEngineService.runSimulation({ organizationId: auth.org, ...body });
  });

  app.get('/scenario', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return scenarioEngineService.list(auth.org);
  });

  // Recommendations
  app.post('/recommendations', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    type: z.string().min(1), priority: z.string().optional(), context: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return recommendationEngineService.generate({ organizationId: auth.org, ...body });
  });

  app.get('/recommendations', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ status: z.string().optional(), priority: z.string().optional(), type: z.string().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return recommendationEngineService.list(auth.org, q);
  });

  app.patch('/recommendations/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { status: string };
    const updated = await recommendationEngineService.updateStatus(id, body.status, auth.sub);
    if (!updated) throw new Error('Recommendation not found');
    return updated;
  });

  // Forecast
  app.post('/forecast', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    metric: z.string().min(1), horizonDays: z.coerce.number().int().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return forecastingService.computeForecast(auth.org, body.metric, body.horizonDays);
  });

  app.get('/forecast', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { forecastType?: string };
    return forecastingService.getForecasts(auth.org, q.forecastType);
  });
}
