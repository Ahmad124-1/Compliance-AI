import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { reportsService } from '../modules/reports/service.js';

const templateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['audit', 'assessment', 'finding', 'capa', 'worker_voice', 'executive', 'compliance', 'organization', 'factory', 'supplier', 'department', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv', 'print']),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function reportRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/reports/templates', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    return reportsService.listTemplates(auth.org);
  });

  app.post('/reports/templates', { preHandler: requirePermission('analytics:create'), schema: { body: templateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof templateSchema>;
    return reportsService.createTemplate(auth.org, body);
  });

  app.post('/reports/generate', { preHandler: requirePermission('analytics:create'), schema: { body: z.object({ type: z.string(), format: z.string(), title: z.string().optional(), filters: z.record(z.any()).optional(), includeCharts: z.boolean().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { type: string; format: string; title?: string; filters?: Record<string, unknown>; includeCharts?: boolean };
    return reportsService.generate({ organizationId: auth.org, userId: auth.sub, type: body.type as any, format: body.format as any, title: body.title, filters: body.filters, includeCharts: body.includeCharts });
  });

  app.get('/reports/:id/download', { preHandler: requirePermission('analytics:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const q = req.query as { format?: string };
    return reportsService.getExportPayload(auth.org, id, (q.format as any) ?? 'pdf');
  });
}
