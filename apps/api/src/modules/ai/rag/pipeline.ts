/**
 * Retrieval-Augmented Generation (RAG) pipeline.
 *
 * Given a natural-language query and context (supplier id, audit id, etc.) the
 * pipeline:
 *   1. Runs semantic vector search (policy/audit/capa/grievance/evidence/supplier)
 *   2. Retrieves structured history: prior CAPAs, audit history, supplier history,
 *      relevant compliance clauses from the knowledge base
 *   3. Builds a grounded prompt by injecting the retrieved context
 *   4. (Optional) streams/returns a completion via the chat orchestrator
 */
import { query } from '../../../db/pool.js';
import { vectorService } from '../vector/service.js';
import { knowledgeService } from '../knowledge/service.js';
import { memoryService } from '../memory/service.js';
import { renderTemplate, renderPrompt, promptTemplateRepo } from '../engine/prompt-engine.js';
import { aiConfigRepo } from '../engine/config.repo.js';
import { createRegistry, resolveCredentials } from '../engine/registry.js';
import { AiDisabledError } from '../engine/providers/null.provider.js';
import type { ChatMessage, CompletionResult, StreamHandler } from '../engine/types.js';

export interface RagContextInput {
  organizationId: string;
  query: string;
  supplierId?: string;
  auditId?: string;
  grievanceId?: string;
  capaId?: string;
  userId?: string | null;
  conversationId?: string;
  /** Limit vector hits. */
  topK?: number;
  /** Domains to search. */
  domains?: Array<'policy' | 'audit' | 'capa' | 'grievance' | 'evidence' | 'supplier'>;
  /** When true, do not call the model — just return assembled context. */
  retrieveOnly?: boolean;
  stream?: boolean;
}

export interface RetrievedContext {
  clauses: string[];
  capas: string[];
  audits: string[];
  suppliers: string[];
  grievances: string[];
  evidence: string[];
  vectorHits: Array<{ domain: string; content: string; score: number }>;
  memory: string;
}

export interface RagResult {
  context: RetrievedContext;
  answer?: string;
  usage?: CompletionResult['usage'];
  cached?: boolean;
  provider?: string;
  model?: string;
}

async function retrieveClauses(organizationId: string, query: string, limit = 5): Promise<string[]> {
  const hits = await knowledgeService.keywordSearch({ organizationId, query });
  return hits.slice(0, limit).map((h) => `• [${h.metadata?.standard ?? 'KB'}] ${h.title}: ${h.content}`);
}

async function retrieveCapas(organizationId: string, opts: { capaId?: string; supplierId?: string; query?: string }): Promise<string[]> {
  const clauses: string[] = [];
  const params: unknown[] = [organizationId];
  let i = 2;
  let where = 'c.organization_id = $1';
  if (opts.capaId) { where += ` AND c.id = $${i++}`; params.push(opts.capaId); }
  if (opts.supplierId) { where += ` AND c.metadata->>'supplierId' = $${i++}`; params.push(opts.supplierId); }
  if (opts.query) { where += ` AND (c.title ILIKE $${i} OR c.description ILIKE $${i})`; params.push(`%${opts.query}%`); i++; }
  params.push(6);
  const { rows } = await query<any>(
    `SELECT c.id, c.title, c.description, c.status, c.priority FROM capas c WHERE ${where} ORDER BY c.created_at DESC LIMIT $${i}`,
    params,
  );
  for (const r of rows) {
    clauses.push(`• CAPA ${r.id} [${r.status}/${r.priority}]: ${r.title}${r.description ? ' — ' + r.description : ''}`);
  }
  return clauses;
}

async function retrieveAudits(organizationId: string, opts: { auditId?: string; supplierId?: string }): Promise<string[]> {
  const clauses: string[] = [];
  const params: unknown[] = [organizationId];
  let i = 2;
  let where = 'a.organization_id = $1';
  if (opts.auditId) { where += ` AND a.id = $${i++}`; params.push(opts.auditId); }
  if (opts.supplierId) { where += ` AND a.supplier_id = $${i++}`; params.push(opts.supplierId); }
  params.push(6);
  const { rows } = await query<any>(
    `SELECT a.id, a.title, a.status, a.type FROM audits a WHERE ${where} ORDER BY a.created_at DESC LIMIT $${i}`,
    params,
  );
  for (const r of rows) {
    clauses.push(`• Audit ${r.id} [${r.status}/${r.type}]: ${r.title}`);
  }
  return clauses;
}

async function retrieveSuppliers(organizationId: string, supplierId?: string): Promise<string[]> {
  if (!supplierId) return [];
  const { rows } = await query<any>(
    `SELECT id, name, country, risk_rating FROM suppliers WHERE organization_id = $1 AND id = $2`,
    [organizationId, supplierId],
  );
  return rows.map((r: any) => `• Supplier ${r.id}: ${r.name} (${r.country ?? 'n/a'}) risk=${r.risk_rating ?? 'unknown'}`);
}

async function retrieveGrievances(organizationId: string, opts: { grievanceId?: string; supplierId?: string; query?: string }): Promise<string[]> {
  const clauses: string[] = [];
  const params: unknown[] = [organizationId];
  let i = 2;
  let where = 'g.organization_id = $1';
  if (opts.grievanceId) { where += ` AND g.id = $${i++}`; params.push(opts.grievanceId); }
  if (opts.supplierId) { where += ` AND g.supplier_id = $${i++}`; params.push(opts.supplierId); }
  if (opts.query) { where += ` AND (g.title ILIKE $${i} OR g.description ILIKE $${i})`; params.push(`%${opts.query}%`); i++; }
  params.push(6);
  const { rows } = await query<any>(
    `SELECT id, title, status, severity FROM grievances g WHERE ${where} ORDER BY g.created_at DESC LIMIT $${i}`,
    params,
  );
  for (const r of rows) clauses.push(`• Grievance ${r.id} [${r.status}/${r.severity}]: ${r.title}`);
  return clauses;
}

async function retrieveEvidence(organizationId: string, evidenceQuery?: string): Promise<string[]> {
  const params: unknown[] = [organizationId];
  let i = 2;
  let where = 'e.organization_id = $1';
  if (evidenceQuery) { where += ` AND (e.title ILIKE $${i} OR e.description ILIKE $${i})`; params.push(`%${evidenceQuery}%`); i++; }
  params.push(6);
  const { rows } = await query<any>(
    `SELECT id, title, category FROM evidence e WHERE ${where} ORDER BY e.created_at DESC LIMIT $${i}`,
    params,
  );
  return rows.map((r: any) => `• Evidence ${r.id} [${r.category ?? 'general'}]: ${r.title}`);
}

export const ragService = {
  /** Assemble retrieved context without calling the model. */
  async retrieve(input: RagContextInput): Promise<RetrievedContext> {
    const config = await aiConfigRepo.get(input.organizationId);
    const vectorHits = await vectorService.search({
      organizationId: input.organizationId,
      query: input.query,
      domains: input.domains ?? ['policy', 'audit', 'capa', 'grievance', 'evidence', 'supplier'].filter((d) => {
        if (d === 'policy') return config.enablePolicy;
        if (d === 'audit') return config.enableAudit;
        if (d === 'capa') return config.enableCapa;
        if (d === 'grievance') return config.enableGrievance;
        if (d === 'evidence') return config.enableEvidence;
        if (d === 'supplier') return config.enableSupplier;
        return true;
      }) as Array<'policy' | 'audit' | 'capa' | 'grievance' | 'evidence' | 'supplier'>,
      limit: input.topK ?? config.ragTopK,
      minScore: config.ragMinScore,
    });

    const [clauses, capas, audits, suppliers, grievances, evidence] = await Promise.all([
      config.enablePolicy ? retrieveClauses(input.organizationId, input.query) : Promise.resolve([]),
      config.enableCapa ? retrieveCapas(input.organizationId, { capaId: input.capaId, supplierId: input.supplierId, query: input.query }) : Promise.resolve([]),
      config.enableAudit ? retrieveAudits(input.organizationId, { auditId: input.auditId, supplierId: input.supplierId }) : Promise.resolve([]),
      config.enableSupplier ? retrieveSuppliers(input.organizationId, input.supplierId) : Promise.resolve([]),
      config.enableGrievance ? retrieveGrievances(input.organizationId, { grievanceId: input.grievanceId, supplierId: input.supplierId, query: input.query }) : Promise.resolve([]),
      config.enableEvidence ? retrieveEvidence(input.organizationId, input.query) : Promise.resolve([]),
    ]);

    const memory = await memoryService.buildContext(input.organizationId, {
      supplierId: input.supplierId,
      auditId: input.auditId,
    });

    return {
      clauses,
      capas,
      audits,
      suppliers,
      grievances,
      evidence,
      vectorHits: vectorHits.map((h) => ({ domain: h.domain, content: h.content, score: h.score })),
      memory,
    };
  },

  /** Build the grounded system + user prompt from retrieved context. */
  async buildPrompt(input: RagContextInput, context: RetrievedContext): Promise<{ system: string; user: string }> {
    const config = await aiConfigRepo.get(input.organizationId);
    const system = await renderPrompt(
      input.organizationId,
      'rag.system',
      { memory: context.memory, systemPrompt: config.systemPrompt ?? '' },
      `You are ComplianceOS AI, an expert compliance assistant for social, environmental and quality standards.
Use ONLY the retrieved context to answer. Cite the standard/clause or record id when possible.
If the context does not contain the answer, say so and suggest the next step.
{{systemPrompt}}
{{memory}}`,
    );
    const user = renderTemplate(
      `User question: {{query}}

Retrieved compliance clauses:
{{clauses}}

Previous CAPAs:
{{capas}}

Audit history:
{{audits}}

Supplier history:
{{suppliers}}

Worker grievances:
{{grievances}}

Evidence:
{{evidence}}

Relevant passages (semantic):
{{vectorHits}}`,
      {
        query: input.query,
        clauses: context.clauses.join('\n') || 'None',
        capas: context.capas.join('\n') || 'None',
        audits: context.audits.join('\n') || 'None',
        suppliers: context.suppliers.join('\n') || 'None',
        grievances: context.grievances.join('\n') || 'None',
        evidence: context.evidence.join('\n') || 'None',
        vectorHits: context.vectorHits.map((h) => `[${h.domain} ${h.score.toFixed(2)}] ${h.content}`).join('\n') || 'None',
      },
    );
    return { system, user };
  },

  /** Full RAG: retrieve + generate (optionally stream). */
  async run(input: RagContextInput): Promise<RagResult> {
    const context = await this.retrieve(input);
    if (input.retrieveOnly) return { context };

    const config = await aiConfigRepo.get(input.organizationId);
    if (config.provider === 'null') {
      return { context, provider: 'null', model: config.model };
    }
    const { system, user } = await this.buildPrompt(input, context);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId: input.organizationId, userId: input.userId ?? null });
    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    const opts = {
      organizationId: input.organizationId,
      userId: input.userId ?? null,
      conversationId: input.conversationId,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      stream: input.stream ?? false,
      jsonMode: false,
    };

    if (input.stream) {
      const streamHandler: StreamHandler = (_chunk) => {
        // streamed chunks are delivered to the caller via the route's SSE bridge.
      };
      const result = await registry.chatProvider().stream(messages, opts, streamHandler);
      return { context, answer: result.text, usage: result.usage, provider: result.provider, model: result.model, cached: result.cached };
    }

    try {
      const result = await registry.withFallback((p) => p.complete(messages, opts));
      return { context, answer: result.text, usage: result.usage, provider: result.provider, model: result.model, cached: result.cached };
    } catch (err) {
      if (err instanceof AiDisabledError) return { context, provider: 'null', model: config.model };
      throw err;
    }
  },
};

export { promptTemplateRepo };
