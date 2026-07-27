import { randomUUID } from 'node:crypto';

import { audit } from '../../core/audit.js';
import { NotFoundError, BadRequestError } from '../../core/errors.js';
import { query } from '../../db/pool.js';
import { createRegistry, resolveCredentials } from '../ai/engine/registry.js';
import { aiConfigRepo } from '../ai/engine/config.repo.js';
import { ragService } from '../ai/rag/pipeline.js';
import { renderPrompt } from '../ai/engine/prompt-engine.js';
import { tokenLedgerRepo } from '../ai/engine/token-ledger.repo.js';
import { AiDisabledError } from '../ai/engine/providers/null.provider.js';
import type { ChatMessage, CompletionResult } from '../ai/engine/types.js';

export interface AuditAssistantSession {
  id: string;
  organizationId: string;
  auditId: string | null;
  userId: string | null;
  mode: string;
  status: string;
  context: Record<string, unknown>;
  result: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditChecklist {
  id: string;
  assistantId: string;
  organizationId: string;
  title: string;
  items: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditFinding {
  id: string;
  assistantId: string;
  organizationId: string;
  title: string;
  description: string | null;
  severity: string;
  category: string | null;
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditInterview {
  id: string;
  assistantId: string;
  organizationId: string;
  question: string;
  response: string | null;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export const aiAuditService = {
  async createSession(organizationId: string, auditId: string | null, userId: string | null, mode: string): Promise<AuditAssistantSession> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const session: AuditAssistantSession = {
      id,
      organizationId,
      auditId,
      userId,
      mode,
      status: 'active',
      context: {},
      result: null,
      createdAt: now,
      updatedAt: now,
    };
    await query(
      `INSERT INTO ai_audit_assistants (id, organization_id, audit_id, user_id, mode, status, context, result, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, organizationId, auditId, userId, mode, 'active', '{}', null, now, now],
    );
    await audit({ organizationId, actorId: userId ?? null, action: 'ai_audit.session.create', entity: 'ai_audit_assistant', entityId: id, metadata: { mode } });
    return session;
  },

  async listSessions(organizationId: string): Promise<AuditAssistantSession[]> {
    const { rows } = await query<Record<string, any>>(
      `SELECT * FROM ai_audit_assistants WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      auditId: r.audit_id,
      userId: r.user_id,
      mode: r.mode,
      status: r.status,
      context: r.context ?? {},
      result: r.result ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async getSession(id: string): Promise<AuditAssistantSession> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM ai_audit_assistants WHERE id = $1`, [id]);
    const row = rows[0];
    if (!row) throw new NotFoundError('AI audit session not found');
    return {
      id: row.id,
      organizationId: row.organization_id,
      auditId: row.audit_id,
      userId: row.user_id,
      mode: row.mode,
      status: row.status,
      context: row.context ?? {},
      result: row.result ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateSession(id: string, patch: Partial<Pick<AuditAssistantSession, 'status' | 'context' | 'result'>>): Promise<AuditAssistantSession> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.context !== undefined) set('context', JSON.stringify(patch.context));
    if (patch.result !== undefined) set('result', JSON.stringify(patch.result));
    if (!sets.length) return this.getSession(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query<any>(`UPDATE ai_audit_assistants SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    const r = rows[0];
    return {
      id: r.id,
      organizationId: r.organization_id,
      auditId: r.audit_id,
      userId: r.user_id,
      mode: r.mode,
      status: r.status,
      context: r.context ?? {},
      result: r.result ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async generateChecklist(organizationId: string, sessionId: string, auditId: string | null, prompt: string): Promise<AuditChecklist> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.checklist', {
      auditId: auditId ?? 'N/A',
      prompt,
    }, `You are ComplianceOS AI Audit Assistant. Generate a structured compliance checklist based on the user's request. Return JSON with a "title" and "items" array, where each item has "id", "text", "category", "priority", and "standard" fields.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.2,
        maxTokens: 2048,
        topP: 1,
        stream: false,
        jsonMode: true,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    let parsed: { title: string; items: unknown[] } = { title: 'AI Generated Checklist', items: [{ id: '1', text: result.text, category: 'general', priority: 'medium', standard: 'AI' }] };
    try {
      const maybe = JSON.parse(result.text);
      if (maybe && typeof maybe === 'object' && 'title' in maybe && Array.isArray((maybe as any).items)) {
        parsed = maybe as { title: string; items: unknown[] };
      }
    } catch {
      // keep default
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    await query(
      `INSERT INTO ai_audit_checklists (id, assistant_id, organization_id, title, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, sessionId, organizationId, parsed.title, JSON.stringify(parsed.items), now, now],
    );

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    await audit({ organizationId, actorId: session.userId ?? null, action: 'ai_audit.checklist.generate', entity: 'ai_audit_checklist', entityId: id });

    return {
      id,
      assistantId: sessionId,
      organizationId,
      title: parsed.title,
      items: parsed.items,
      createdAt: now,
      updatedAt: now,
    };
  },

  async generateFindings(organizationId: string, sessionId: string, auditId: string | null, context: Record<string, unknown>): Promise<AuditFinding[]> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const rag = await ragService.run({
      organizationId,
      query: (context.query as string | undefined) ?? 'Generate audit findings',
      auditId: auditId ?? undefined,
      userId: session.userId ?? null,
      conversationId: sessionId,
    });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.findings', {
      auditId: auditId ?? 'N/A',
      context: JSON.stringify(context),
    }, `You are ComplianceOS AI Audit Assistant. Analyze the provided context and generate structured audit findings. Return JSON array of findings, each with "title", "description", "severity" (low/medium/high/critical), "category", and "recommendation".`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context: ${JSON.stringify(context)}\n\nRetrieved context: ${rag.context.clauses.join('\n')}\n\nGenerate audit findings.` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.2,
        maxTokens: 2048,
        topP: 1,
        stream: false,
        jsonMode: true,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    let parsed: Array<{ title: string; description?: string; severity: string; category?: string; recommendation?: string }> = [];
    try {
      parsed = JSON.parse(result.text);
    } catch {
      parsed = [{ title: 'AI Generated Finding', description: result.text, severity: 'medium', category: 'general', recommendation: 'Review manually' }];
    }

    const findings: AuditFinding[] = [];
    const now = new Date().toISOString();
    for (const item of parsed) {
      const id = randomUUID();
      await query(
        `INSERT INTO ai_audit_findings (id, assistant_id, organization_id, title, description, severity, category, recommendation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, sessionId, organizationId, item.title, item.description ?? null, item.severity, item.category ?? null, item.recommendation ?? null, now, now],
      );
      findings.push({
        id,
        assistantId: sessionId,
        organizationId,
        title: item.title,
        description: item.description ?? null,
        severity: item.severity,
        category: item.category ?? null,
        recommendation: item.recommendation ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    await audit({ organizationId, actorId: session.userId ?? null, action: 'ai_audit.findings.generate', entity: 'ai_audit_finding', entityId: sessionId, metadata: { count: findings.length } });

    return findings;
  },

  async assistInterview(organizationId: string, sessionId: string, question: string, context: Record<string, unknown>): Promise<AuditInterview> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const rag = await ragService.run({
      organizationId,
      query: question,
      auditId: session.auditId ?? undefined,
      userId: session.userId ?? null,
      conversationId: sessionId,
    });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.interview', {
      context: JSON.stringify(context),
    }, `You are ComplianceOS AI Audit Interview Assistant. Provide guidance on interview questions, suggest follow-up questions, and help prepare interview scripts. Be concise and professional.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Question: ${question}\n\nContext: ${JSON.stringify(context)}\n\nRetrieved compliance context: ${rag.context.clauses.join('\n')}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.3,
        maxTokens: 1024,
        topP: 1,
        stream: false,
        jsonMode: false,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    await query(
      `INSERT INTO ai_audit_interviews (id, assistant_id, organization_id, question, response, context, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, sessionId, organizationId, question, result.text, JSON.stringify(context), now, now],
    );

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    return {
      id,
      assistantId: sessionId,
      organizationId,
      question,
      response: result.text,
      context,
      createdAt: now,
      updatedAt: now,
    };
  },

  async generateReport(organizationId: string, sessionId: string, auditId: string | null, type: string): Promise<Record<string, unknown>> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const rag = await ragService.run({
      organizationId,
      query: `Generate ${type} report for audit ${auditId ?? 'N/A'}`,
      auditId: auditId ?? undefined,
      userId: session.userId ?? null,
      conversationId: sessionId,
    });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.report', {
      type,
      auditId: auditId ?? 'N/A',
    }, `You are ComplianceOS AI Audit Assistant. Generate an AI-enhanced ${type} report based on the retrieved context. Include executive summary, findings, and recommendations.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Report type: ${type}\n\nRetrieved context: ${rag.context.clauses.join('\n')}\n${rag.context.audits.join('\n')}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.2,
        maxTokens: 4096,
        topP: 1,
        stream: false,
        jsonMode: false,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    const report = {
      type,
      auditId,
      content: result.text,
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
    };

    await this.updateSession(sessionId, { result: report });
    await audit({ organizationId, actorId: session.userId ?? null, action: 'ai_audit.report.generate', entity: 'ai_audit_report', entityId: sessionId, metadata: { type } });

    return report;
  },

  async planAudit(organizationId: string, sessionId: string, auditId: string | null, scope: string): Promise<Record<string, unknown>> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.plan', {
      scope,
      auditId: auditId ?? 'N/A',
    }, `You are ComplianceOS AI Audit Planner. Create a structured audit plan based on the provided scope. Include objectives, scope, methodology, timeline, and resource requirements. Return JSON with "title", "objectives", "scope", "methodology", "timeline", and "resources" fields.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Scope: ${scope}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.3,
        maxTokens: 2048,
        topP: 1,
        stream: false,
        jsonMode: true,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    let plan: Record<string, unknown> = {};
    try {
      plan = JSON.parse(result.text);
    } catch {
      plan = { title: 'AI Audit Plan', content: result.text };
    }

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    await this.updateSession(sessionId, { result: plan });
    await audit({ organizationId, actorId: session.userId ?? null, action: 'ai_audit.plan', entity: 'ai_audit_plan', entityId: sessionId });

    return plan;
  },

  async reviewDocument(organizationId: string, sessionId: string, documentId: string): Promise<Record<string, unknown>> {
    const session = await this.getSession(sessionId);
    if (session.organizationId !== organizationId) throw new NotFoundError('Session not found');

    const docRows = await query<Record<string, any>>(`SELECT * FROM ai_documents WHERE id = $1 AND organization_id = $2`, [documentId, organizationId]);
    const doc = docRows[0];
    if (!doc) throw new NotFoundError('Document not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId: session.userId ?? null });

    const systemPrompt = await renderPrompt(organizationId, 'ai_audit.document_review', {}, `You are ComplianceOS AI Document Reviewer. Review the provided document for compliance gaps, risks, and improvement opportunities. Return JSON with "summary", "gaps", "risks", and "recommendations" arrays.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Document: ${doc.filename}\n\nContent:\n${doc.extracted_text ?? ''}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId: session.userId ?? null,
        conversationId: sessionId,
        model: config.model,
        temperature: 0.2,
        maxTokens: 2048,
        topP: 1,
        stream: false,
        jsonMode: true,
      }));
    } catch (err) {
      if (err instanceof AiDisabledError) {
        throw new BadRequestError('AI provider is not configured for this organization');
      }
      throw err;
    }

    let review: Record<string, unknown> = {};
    try {
      review = JSON.parse(result.text);
    } catch {
      review = { summary: result.text, gaps: [], risks: [], recommendations: [] };
    }

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId: session.userId ?? null,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    await this.updateSession(sessionId, { result: review });
    await audit({ organizationId, actorId: session.userId ?? null, action: 'ai_audit.document.review', entity: 'ai_document', entityId: documentId });

    return review;
  },
};
