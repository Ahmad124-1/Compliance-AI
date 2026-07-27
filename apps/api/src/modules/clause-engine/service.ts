import { audit } from '../../core/audit.js';
import { NotFoundError, BadRequestError } from '../../core/errors.js';
import { query } from '../../db/pool.js';
import { knowledgeService } from '../ai/knowledge/service.js';
import { ragService } from '../ai/rag/pipeline.js';
import { createRegistry, resolveCredentials } from '../ai/engine/registry.js';
import { aiConfigRepo } from '../ai/engine/config.repo.js';
import { renderPrompt } from '../ai/engine/prompt-engine.js';
import { tokenLedgerRepo } from '../ai/engine/token-ledger.repo.js';
import { AiDisabledError } from '../ai/engine/providers/null.provider.js';
import type { ChatMessage, CompletionResult } from '../ai/engine/types.js';

export interface ClauseSearchResult {
  standard: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
  clause: {
    id: string;
    standardId: string;
    code: string | null;
    title: string;
    body: string;
    category: string | null;
    position: number;
  };
  score?: number;
}

export interface ClauseDetail extends ClauseSearchResult {
  relatedClauses: ClauseSearchResult[];
}

export const clauseEngineService = {
  async searchClauses(organizationId: string, searchQuery: string): Promise<ClauseSearchResult[]> {
    const standards = await knowledgeService.listStandards({ search: searchQuery, activeOnly: true });
    const results: ClauseSearchResult[] = [];

    for (const standard of standards.slice(0, 10)) {
      const clauses = await knowledgeService.listClauses(standard.id);
      for (const clause of clauses) {
        if (clause.title.toLowerCase().includes(searchQuery.toLowerCase()) || clause.body.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({
            standard: {
              id: standard.id,
              code: standard.code,
              name: standard.name,
              category: standard.category,
            },
            clause: {
              id: clause.id,
              standardId: clause.standardId,
              code: clause.code,
              title: clause.title,
              body: clause.body,
              category: clause.category,
              position: clause.position,
            },
          });
        }
      }
    }

    if (results.length === 0) {
      const rag = await ragService.retrieve({
        organizationId,
        query: searchQuery,
        domains: ['policy'],
        topK: 5,
      });
      for (const hit of rag.vectorHits) {
        results.push({
          standard: {
            id: 'unknown',
            code: 'RAG',
            name: 'Semantic Search Result',
            category: 'general',
          },
          clause: {
            id: hit.domain,
            standardId: 'unknown',
            code: null,
            title: hit.content.slice(0, 100),
            body: hit.content,
            category: null,
            position: 0,
          },
          score: hit.score,
        });
      }
    }

    await audit({ organizationId, actorId: null, action: 'clause.search', entity: 'knowledge_clause', entityId: null, metadata: { query: searchQuery, count: results.length } });

    return results;
  },

  async getClause(standardId: string, clauseId: string): Promise<ClauseDetail> {
    const standardRows = await query<Record<string, any>>(`SELECT * FROM knowledge_standards WHERE id = $1`, [standardId]);
    const standard = standardRows[0];
    if (!standard) throw new NotFoundError('Standard not found');

    const clauseRows = await query<Record<string, any>>(`SELECT * FROM knowledge_clauses WHERE id = $1 AND standard_id = $2`, [clauseId, standardId]);
    const clause = clauseRows[0];
    if (!clause) throw new NotFoundError('Clause not found');

    const relatedClauses = await knowledgeService.listClauses(standardId);
    const related = relatedClauses
      .filter((c) => c.id !== clauseId)
      .slice(0, 10)
      .map((c) => ({
        standard: {
          id: standard.id,
          code: standard.code,
          name: standard.name,
          category: standard.category,
        },
        clause: {
          id: c.id,
          standardId: c.standardId,
          code: c.code,
          title: c.title,
          body: c.body,
          category: c.category,
          position: c.position,
        },
      }));

    return {
      standard: {
        id: standard.id,
        code: standard.code,
        name: standard.name,
        category: standard.category,
      },
      clause: {
        id: clause.id,
        standardId: clause.standard_id,
        code: clause.code,
        title: clause.title,
        body: clause.body,
        category: clause.category,
        position: clause.position,
      },
      relatedClauses: related,
    };
  },

  async explainClause(organizationId: string, clauseId: string): Promise<Record<string, unknown>> {
    const clauseRows = await query<Record<string, any>>(`SELECT * FROM knowledge_clauses WHERE id = $1`, [clauseId]);
    const clause = clauseRows[0];
    if (!clause) throw new NotFoundError('Clause not found');

    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId });

    const rag = await ragService.retrieve({
      organizationId,
      query: `Explain clause: ${clause.title} ${clause.body}`,
      domains: ['policy'],
      topK: 5,
    });

    const systemPrompt = await renderPrompt(organizationId, 'clause_explainer.explain', {}, `You are ComplianceOS AI Clause Explainer. Explain the given compliance clause in plain language. Include purpose, requirements, and practical implementation guidance.`);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Clause: ${clause.title}\n\nBody: ${clause.body}\n\nContext: ${rag.clauses.join('\n')}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
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

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    const explanation = {
      clauseId,
      standardId: clause.standard_id,
      title: clause.title,
      explanation: result.text,
      provider: result.provider,
      model: result.model,
      generatedAt: new Date().toISOString(),
    };

    await audit({ organizationId, actorId: null, action: 'clause.explain', entity: 'knowledge_clause', entityId: clauseId });

    return explanation;
  },
};
