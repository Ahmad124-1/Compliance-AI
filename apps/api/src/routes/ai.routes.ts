import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { aiService } from '../modules/ai/service.js';
import { authenticate, getAuth, requirePermission } from '../routes/guard.js';

const analyzeSchema = z.object({
  text: z.string().min(1),
  locale: z.string().optional(),
  context: z.record(z.any()).optional(),
  existing: z.array(z.object({ id: z.string(), text: z.string() })).optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
});

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/ai/capabilities', { preHandler: requirePermission('ai:read') }, async () => {
    return {
      provider: aiService.activeProvider(),
      capabilities: aiService.capabilities(),
    };
  });

  app.post('/ai/analyze', { preHandler: requirePermission('ai:read'), schema: { body: analyzeSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof analyzeSchema>;
    const result = await aiService.analyze({
      text: body.text,
      locale: (body.locale as any) ?? undefined,
      context: { ...(body.context ?? {}), organizationId: auth.org },
      existing: body.existing,
      category: body.category,
      priority: body.priority,
    });
    return result;
  });

  app.post(
    '/ai/translate',
    {
      preHandler: requirePermission('ai:read'),
      schema: {
        body: z.object({
          text: z.string().min(1),
          source: z.string().min(2),
          target: z.string().min(2),
        }),
      },
    },
    async (req) => {
      const body = req.body as { text: string; source: string; target: string };
      const result = await aiService.translate(body.text, body.source as any, body.target as any);
      return result ?? { translatedText: body.text, sourceLanguage: body.source, targetLanguage: body.target };
    },
  );
}
