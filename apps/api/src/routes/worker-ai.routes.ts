import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, getAuth, requirePermission } from '../routes/guard.js';
import { workerAiService } from '../services/worker-ai.service.js';
import { voiceAiService } from '../services/voice-ai.service.js';
import { trainingAiService } from '../services/training-ai.service.js';
import { documentAssistantService } from '../services/document-assistant.service.js';
import { languageEngineService } from '../services/language-engine.service.js';
import { query } from '../db/pool.js';
import type { LanguageCode } from '../types/worker-ai.js';

export async function workerAiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/worker-ai/chat', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    conversationId: z.string().min(1),
    message: z.string().min(1),
    language: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).default('en'),
    useRag: z.boolean().default(true),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { conversationId: string; message: string; language: LanguageCode; useRag: boolean };
    return workerAiService.chat({
      organizationId: auth.org,
      userId: auth.sub,
      conversationId: body.conversationId,
      message: body.message,
      language: body.language,
      useRag: body.useRag,
    });
  });

  app.get('/worker-ai/history', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({
    conversationId: z.string().min(1),
    limit: z.coerce.number().int().default(50),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { conversationId: string; limit: number };
    return workerAiService.getConversationHistory(auth.org, q.conversationId, q.limit);
  });

  app.get('/worker-ai/conversations', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return workerAiService.listConversations(auth.org, auth.sub);
  });

  app.get('/worker-ai/knowledge/search', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({
    query: z.string().min(1),
    category: z.string().optional(),
    language: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { query: string; category?: string; language?: LanguageCode };
    return workerAiService.searchKnowledge({ organizationId: auth.org, query: q.query, category: q.category, language: q.language });
  });

  app.get('/worker-ai/languages', { preHandler: requirePermission('ai:read') }, async (_req) => {
    return workerAiService.getAvailableLanguages();
  });

  app.post('/worker-ai/translate', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    text: z.string().min(1),
    source: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).default('en'),
    target: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']),
  }) } }, async (req) => {
    const body = req.body as { text: string; source: LanguageCode; target: LanguageCode };
    return languageEngineService.translate({ text: body.text, source: body.source, target: body.target });
  });

  app.post('/worker-ai/documents', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    content: z.string().min(1),
    filename: z.string().min(1).optional(),
    language: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).default('en'),
  }) } }, async (req) => {
    const body = req.body as { content: string; filename?: string; language: LanguageCode };
    return documentAssistantService.summarize({
      content: body.content,
      language: body.language,
    });
  });

  app.get('/worker-ai/documents', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { limit?: string };
    const limit = q.limit ? parseInt(q.limit, 10) : 50;
    const { rows } = await query(
      'SELECT id, organization_id, user_id, filename, mime_type as "mimeType", size_bytes as "sizeBytes", storage_path as "storagePath", summary, metadata, language, created_at as "createdAt" FROM worker_ai_documents WHERE organization_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT $3',
      [auth.org, auth.sub, limit],
    );
    return rows;
  });

  app.post('/worker-ai/voice/transcribe', { preHandler: requirePermission('ai:read') }, async (req) => {
    const body = req.body as { audio: string; language?: LanguageCode };
    return voiceAiService.transcribe({ audioData: Buffer.from(body.audio || ''), language: body.language });
  });

  app.post('/worker-ai/voice/synthesize', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    text: z.string().min(1),
    language: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).default('en'),
    voice: z.string().optional(),
  }) } }, async (req) => {
    return voiceAiService.synthesize(req.body as any);
  });

  app.post('/worker-ai/training/quiz', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    topic: z.string().min(1),
    difficulty: z.enum(['easy','medium','hard']).default('easy'),
    count: z.coerce.number().int().min(1).max(20).default(5),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { topic: string; difficulty: string; count: number };
    return workerAiService.generateTrainingQuiz({ organizationId: auth.org, userId: auth.sub, topic: body.topic, _difficulty: body.difficulty });
  });

  app.get('/worker-ai/training/recommendations', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return trainingAiService.getTrainingRecommendations(auth.org, auth.sub);
  });

  app.get('/worker-ai/training/progress', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return trainingAiService.getProgress(auth.org, auth.sub);
  });

  app.get('/worker-ai/rights/topics', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({
    language: z.enum(['en','ur','ar','hi','bn','zh','vi','tr','es','fr']).default('en'),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { language: LanguageCode };
    return workerAiService.listRightsTopics(auth.org, q.language);
  });

  app.get('/worker-ai/emergency/contacts', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return workerAiService.listEmergencyContacts(auth.org);
  });

  app.get('/worker-ai/usage', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return workerAiService.getUsageStats(auth.org);
  });
}
