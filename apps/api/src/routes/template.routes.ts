import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { templateService } from '../services/template.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const templateSchema = z.object({
  name: z.string().min(1),
  channel: z.string().min(1),
  type: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  locale: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/templates', { preHandler: requirePermission('template:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { channel?: string; type?: string };
    return templateService.listTemplates(auth.org, { channel: q.channel, type: q.type });
  });

  app.get('/templates/stats', { preHandler: requirePermission('template:read') }, async (req) => {
    const auth = getAuth(req);
    const templates = await templateService.listTemplates(auth.org);
    return {
      total: templates.length,
      byChannel: templates.reduce<Record<string, number>>((acc, t) => {
        acc[t.channel] = (acc[t.channel] ?? 0) + 1;
        return acc;
      }, {}),
    };
  });

  app.post('/templates', { preHandler: requirePermission('template:create'), schema: { body: templateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof templateSchema>;
    return templateService.createTemplate({ organizationId: auth.org, ...body }, auth.sub);
  });

  app.get('/templates/:id', { preHandler: requirePermission('template:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return templateService.getTemplate(auth.org, id);
  });

  app.patch('/templates/:id', { preHandler: requirePermission('template:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return templateService.updateTemplate(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/templates/:id', { preHandler: requirePermission('template:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await templateService.deleteTemplate(auth.org, id);
    return { success: true };
  });

  app.post('/templates/:id/render', { preHandler: requirePermission('template:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { variables } = req.body as { variables: Record<string, string> };
    const template = await templateService.getTemplate(auth.org, id);
    return templateService.renderTemplate(template, variables ?? {});
  });

  app.post('/templates/:id/duplicate', { preHandler: requirePermission('template:create') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const source = await templateService.getTemplate(auth.org, id);
    return templateService.createTemplate(
      {
        organizationId: auth.org,
        name: `${source.name} (copy)`,
        channel: source.channel,
        type: source.type,
        subject: source.subject,
        body: source.body,
        variables: source.variables as string[],
        locale: source.locale,
        isDefault: false,
      },
      auth.sub,
    );
  });

  app.post('/templates/defaults/seed', { preHandler: requirePermission('template:create') }, async (req) => {
    const auth = getAuth(req);
    return templateService.createDefaultTemplates(auth.org);
  });
}
