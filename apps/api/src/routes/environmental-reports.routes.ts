import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentalReportsService } from '../services/environmental-reports.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const reportCreateSchema = z.object({
  facilityId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  reportType: z.enum(['environmental','water','waste','air','chemical','incident','permit','biodiversity','executive','compliance']),
  format: z.enum(['pdf','xlsx','csv','docx']).default('pdf'),
  status: z.enum(['draft','generated','archived']).optional(),
  summary: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  schedule: z.enum(['none','daily','weekly','monthly','quarterly','yearly']).optional(),
});

const reportUpdateSchema = reportCreateSchema.partial();

export async function environmentalReportsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/environmental-reports', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    return environmentalReportsService.list(auth.org, req.query as Record<string, string | undefined>);
  });

  app.get('/environmental-reports/:id', { preHandler: requirePermission('environment:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalReportsService.get(auth.org, id);
  });

  app.post('/environmental-reports', { preHandler: requirePermission('environment:create'), schema: { body: reportCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    return environmentalReportsService.create(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.post('/environmental-reports/generate', { preHandler: requirePermission('environment:create') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown> || {};
    return environmentalReportsService.generateEnvironmentalReport(auth.org, {
      facilityId: body.facilityId as string | undefined,
      startDate: body.startDate as string | undefined,
      endDate: body.endDate as string | undefined,
    });
  });

  app.patch('/environmental-reports/:id', { preHandler: requirePermission('environment:update'), schema: { body: reportUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalReportsService.update(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/environmental-reports/:id', { preHandler: requirePermission('environment:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return environmentalReportsService.delete(auth.org, id, auth.sub);
  });
}
