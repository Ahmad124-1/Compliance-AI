/**
 * AI Foundation routes (Sprint 5A).
 *
 * Endpoints:
 *   GET  /ai/config                  — read org AI config (admin)
 *   PUT  /ai/config                 — update org AI config (admin)
 *   GET  /ai/capabilities           — active provider + capability info
 *   GET  /ai/providers              — available provider kinds + configured state
 *   GET  /ai/prompts                — list prompt templates
 *   POST /ai/prompts                — create prompt template (admin)
 *   PUT  /ai/prompts/:id            — update prompt template (admin)
 *   DELETE /ai/prompts/:id          — delete prompt template (admin)
 *   GET  /ai/knowledge/standards    — list knowledge standards
 *   POST /ai/knowledge/ingest       — ingest a document (admin)
 *   GET  /ai/vector/search          — semantic vector search
 *   POST /ai/vector/index/kb        — (re)index knowledge base
 *   POST /ai/vector/index           — index arbitrary text
 *   POST /ai/rag                    — RAG retrieve + answer
 *   GET  /ai/rag/context           — retrieve-only context
 *   POST /ai/chat                   — chat (non-streaming) with memory + optional RAG
 *   POST /ai/chat/stream            — chat (SSE streaming)
 *   GET  /ai/memory/:scope          — read memory
 *   POST /ai/memory                 — write memory (admin)
 *   DELETE /ai/memory/:scope        — clear memory scope
 *   POST /ai/jobs                   — enqueue a background job
 *   GET  /ai/jobs                   — list jobs
 *   GET  /ai/jobs/stats             — job stats
 *   GET  /ai/usage                  — token/cost accounting summary
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { aiConfigRepo } from '../modules/ai/engine/config.repo.js';
import { promptTemplateRepo, renderPrompt } from '../modules/ai/engine/prompt-engine.js';
import { tokenLedgerRepo } from '../modules/ai/engine/token-ledger.repo.js';
import { knowledgeService } from '../modules/ai/knowledge/service.js';
import { vectorService } from '../modules/ai/vector/service.js';
import { ragService } from '../modules/ai/rag/pipeline.js';
import { memoryService } from '../modules/ai/memory/service.js';
import { chatService } from '../modules/ai/chat.service.js';
import { aiJobRepo, enqueueIndexKnowledgeBase, type JobType } from '../modules/ai/engine/jobs.queue.js';
import { AI_PROVIDERS, AI_MODELS } from '../config/ai-models.js';
import { authenticate, getAuth, requirePermission } from './guard.js';
import { resolveCredentials } from '../modules/ai/engine/registry.js';

const configPatch = z.object({
  provider: z.enum(['openai', 'anthropic', 'gemini', 'azure', 'ollama', 'null']).optional(),
  embeddingProvider: z.enum(['openai', 'azure', 'ollama', 'null']).optional(),
  model: z.string().min(1).optional(),
  embeddingModel: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(32000).optional(),
  topP: z.number().min(0).max(1).optional(),
  fallbackEnabled: z.boolean().optional(),
  fallbackOrder: z.array(z.string()).optional(),
  rateLimitRpm: z.number().int().min(1).optional(),
  rateLimitTpm: z.number().int().min(1).optional(),
  cacheEnabled: z.boolean().optional(),
  cacheTtlSeconds: z.number().int().min(0).optional(),
  streamingEnabled: z.boolean().optional(),
  ragTopK: z.number().int().min(0).max(50).optional(),
  ragMinScore: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().nullable().optional(),
  enableAudit: z.boolean().optional(),
  enableSupplier: z.boolean().optional(),
  enableCapa: z.boolean().optional(),
  enableGrievance: z.boolean().optional(),
  enableEvidence: z.boolean().optional(),
  enablePolicy: z.boolean().optional(),
});

export async function aiFoundationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ----- Capabilities / providers -----
  app.get('/ai/capabilities', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const config = await aiConfigRepo.get(auth.org);
    const creds = resolveCredentials();
    const providers = AI_PROVIDERS.map((p) => ({
      kind: p.kind,
      label: p.label,
      chatConfigured: p.kind === 'null' ? false : Boolean((creds as any)[p.credKey]),
      embeddingConfigured: p.embeddingCredKey ? Boolean((creds as any)[p.embeddingCredKey]) : false,
    }));
    return {
      provider: config.provider,
      embeddingProvider: config.embeddingProvider,
      model: config.model,
      embeddingModel: config.embeddingModel,
      providers,
      models: AI_MODELS,
      streamingEnabled: config.streamingEnabled,
      rag: { topK: config.ragTopK, minScore: config.ragMinScore },
    };
  });

  // ----- Config (admin) -----
  app.get('/ai/config', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    return aiConfigRepo.get(auth.org);
  });

  app.put('/ai/config', { preHandler: requirePermission('ai:update'), schema: { body: configPatch } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof configPatch>;
    return aiConfigRepo.update(auth.org, body as any);
  });

  // ----- Prompt templates -----
  app.get('/ai/prompts', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return promptTemplateRepo.list(auth.org);
  });

  app.post('/ai/prompts', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    key: z.string().min(1),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    category: z.string().optional(),
    content: z.string().min(1),
    variables: z.array(z.string()).optional(),
    isDefault: z.boolean().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return promptTemplateRepo.create({ organizationId: auth.org, createdBy: auth.sub, ...body });
  });

  app.put('/ai/prompts/:id', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    content: z.string().optional(),
    variables: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }) } }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const updated = await promptTemplateRepo.update(id, body);
    if (!updated) throw new Error('Prompt template not found');
    return updated;
  });

  app.delete('/ai/prompts/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const { id } = req.params as { id: string };
    await promptTemplateRepo.remove(id);
    return { ok: true };
  });

  app.post('/ai/prompts/render', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    key: z.string().min(1),
    variables: z.record(z.any()).optional(),
    fallback: z.string().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { key: string; variables?: Record<string, unknown>; fallback?: string };
    return { rendered: await renderPrompt(auth.org, body.key, body.variables ?? {}, body.fallback) };
  });

  // ----- Knowledge base -----
  app.get('/ai/knowledge/standards', { preHandler: requirePermission('ai:read') }, async (req) => {
    const q = req.query as { category?: string; search?: string };
    return knowledgeService.listStandards({ category: q.category as any, search: q.search });
  });

  app.post('/ai/knowledge/ingest', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    domain: z.enum(['policy', 'audit', 'capa', 'grievance', 'evidence', 'supplier']),
    title: z.string().min(1),
    content: z.string().min(1),
    standardId: z.string().uuid().optional(),
    language: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    index: z.boolean().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    const entries = await knowledgeService.ingest({
      organizationId: auth.org,
      domain: body.domain,
      title: body.title,
      content: body.content,
      standardId: body.standardId,
      language: body.language,
      metadata: body.metadata,
    });
    if (body.index) {
      for (const e of entries) await vectorService.indexKnowledgeEntry(e.id, auth.org);
    }
    return { entries: entries.length };
  });

  // ----- Vector search -----
  app.get('/ai/vector/search', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { query: string; domains?: string; limit?: string; minScore?: string };
    const domains = q.domains ? (q.domains.split(',') as any[]) : undefined;
    return vectorService.search({
      organizationId: auth.org,
      query: q.query,
      domains,
      limit: q.limit ? Number(q.limit) : undefined,
      minScore: q.minScore ? Number(q.minScore) : undefined,
    });
  });

  app.post('/ai/vector/index/kb', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const count = await vectorService.indexKnowledgeBase(auth.org);
    return { indexed: count };
  });

  app.post('/ai/vector/index', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    sourceType: z.enum(['knowledge_entry', 'policy', 'audit', 'capa', 'grievance', 'evidence', 'supplier']),
    sourceId: z.string().min(1),
    domain: z.enum(['policy', 'audit', 'capa', 'grievance', 'evidence', 'supplier']),
    content: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    await vectorService.index({
      organizationId: auth.org,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      domain: body.domain,
      content: body.content,
      metadata: body.metadata,
    });
    return { ok: true };
  });

  // ----- RAG -----
  app.post('/ai/rag', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    query: z.string().min(1),
    supplierId: z.string().uuid().optional(),
    auditId: z.string().uuid().optional(),
    grievanceId: z.string().uuid().optional(),
    capaId: z.string().uuid().optional(),
    domains: z.array(z.string()).optional(),
    topK: z.number().int().optional(),
    retrieveOnly: z.boolean().optional(),
    stream: z.boolean().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return ragService.run({
      organizationId: auth.org,
      query: body.query,
      supplierId: body.supplierId,
      auditId: body.auditId,
      grievanceId: body.grievanceId,
      capaId: body.capaId,
      domains: body.domains,
      topK: body.topK,
      retrieveOnly: body.retrieveOnly,
      stream: body.stream,
    });
  });

  app.get('/ai/rag/context', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { query: string; supplierId?: string; auditId?: string };
    const ctx = await ragService.retrieve({
      organizationId: auth.org,
      query: q.query,
      supplierId: q.supplierId,
      auditId: q.auditId,
    });
    return ctx;
  });

  // ----- Chat (non-streaming) -----
  app.post('/ai/chat', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    conversationId: z.string().min(1),
    message: z.string().min(1),
    supplierId: z.string().uuid().optional(),
    auditId: z.string().uuid().optional(),
    useRag: z.boolean().optional(),
    systemPrompt: z.string().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return chatService.send({
      organizationId: auth.org,
      conversationId: body.conversationId,
      message: body.message,
      userId: auth.sub,
      supplierId: body.supplierId,
      auditId: body.auditId,
      useRag: body.useRag,
      systemPromptOverride: body.systemPrompt,
    });
  });

  // ----- Chat (SSE streaming) -----
  app.post('/ai/chat/stream', { preHandler: requirePermission('ai:read'), schema: { body: z.object({
    conversationId: z.string().min(1),
    message: z.string().min(1),
    supplierId: z.string().uuid().optional(),
    auditId: z.string().uuid().optional(),
    useRag: z.boolean().optional(),
    systemPrompt: z.string().optional(),
  }) } }, async (req, reply) => {
    const auth = getAuth(req);
    const body = req.body as any;
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\n`);
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await chatService.stream(
        {
          organizationId: auth.org,
          conversationId: body.conversationId,
          message: body.message,
          userId: auth.sub,
          supplierId: body.supplierId,
          auditId: body.auditId,
          useRag: body.useRag,
          systemPromptOverride: body.systemPrompt,
        },
        (chunk) => send('token', chunk),
      );
      send('done', { ok: true });
    } catch (err) {
      send('error', { message: (err as Error).message });
    } finally {
      reply.raw.end();
    }
  });

  // ----- Memory -----
  app.get('/ai/memory/:scope', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { scope } = req.params as { scope: string };
    const q = req.query as { scopeId?: string };
    if (scope === 'conversation') return memoryService.getConversationMessages(auth.org, q.scopeId ?? '', undefined);
    if (scope === 'organization') return memoryService.getOrganizationMemory(auth.org);
    if (scope === 'supplier') return memoryService.getSupplierMemory(auth.org, q.scopeId ?? '');
    if (scope === 'audit') return memoryService.getAuditMemory(auth.org, q.scopeId ?? '');
    throw new Error('Unknown memory scope');
  });

  app.post('/ai/memory', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    scope: z.enum(['conversation', 'organization', 'supplier', 'audit']),
    scopeId: z.string().nullable().optional(),
    role: z.enum(['system', 'user', 'assistant', 'note']),
    content: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return memoryService.record({
      organizationId: auth.org,
      scope: body.scope,
      scopeId: body.scopeId ?? null,
      role: body.role,
      content: body.content,
      createdBy: auth.sub,
      metadata: body.metadata,
    });
  });

  app.delete('/ai/memory/:scope', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { scope } = req.params as { scope: string };
    const q = req.query as { scopeId?: string };
    if (scope === 'conversation') {
      return { cleared: await memoryService.clearConversation(auth.org, q.scopeId ?? '') };
    }
    const { memoryRepo } = await import('../modules/ai/memory/repository.js');
    return { cleared: await memoryRepo.clearScope(scope as any, auth.org, q.scopeId ?? null) };
  });

  // ----- Jobs -----
  app.post('/ai/jobs', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    type: z.enum(['embed', 'summarize', 'analyze', 'generate', 'rag', 'translate', 'index_kb']),
    payload: z.record(z.any()).optional(),
    priority: z.number().int().optional(),
    scheduledFor: z.string().optional(),
    maxAttempts: z.number().int().optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as { type: JobType; payload?: Record<string, unknown>; priority?: number; scheduledFor?: string; maxAttempts?: number };
    return aiJobRepo.enqueue({
      organizationId: auth.org,
      type: body.type,
      payload: body.payload,
      priority: body.priority,
      createdBy: auth.sub,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      maxAttempts: body.maxAttempts,
    });
  });

  app.get('/ai/jobs', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { status?: string };
    return aiJobRepo.list(auth.org, q.status as any);
  });

  app.get('/ai/jobs/stats', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return aiJobRepo.stats(auth.org);
  });

  app.post('/ai/jobs/index-kb', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    return enqueueIndexKnowledgeBase(auth.org);
  });

  // ----- Usage / accounting -----
  app.get('/ai/usage', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { days?: string };
    const [summary, recent] = await Promise.all([
      tokenLedgerRepo.summary(auth.org, q.days ? Number(q.days) : 30),
      tokenLedgerRepo.recent(auth.org, 50),
    ]);
    return { summary, recent };
  });
}
