/**
 * Knowledge Base service.
 *
 * High-level operations over standards, clauses and indexed entries: listing,
 * chunking source documents into entries, and a fallback keyword search used
 * when embeddings are unavailable. Semantic vector search lives in the
 * `vector` module which consumes these entries.
 */
import { knowledgeRepo } from './repository.js';
import type { KnowledgeCategory, KnowledgeDomain, KnowledgeEntry, KnowledgeStandard } from './types.js';

const CHUNK_SIZE = 1200; // characters per chunk

function chunkText(text: string, size = CHUNK_SIZE): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export const knowledgeService = {
  listStandards(filter: { category?: KnowledgeCategory; activeOnly?: boolean; search?: string } = {}): Promise<KnowledgeStandard[]> {
    return knowledgeRepo.listStandards(filter);
  },

  async getStandard(code: string, organizationId?: string | null): Promise<KnowledgeStandard | null> {
    return knowledgeRepo.findStandardByCode(code, organizationId);
  },

  listClauses(standardId: string) {
    return knowledgeRepo.listClauses(standardId);
  },

  /** Ingest a free-form document as chunked knowledge entries under a domain. */
  async ingest(input: {
    organizationId?: string | null;
    standardId?: string | null;
    domain: KnowledgeDomain;
    title: string;
    content: string;
    language?: string;
    metadata?: Record<string, unknown>;
  }): Promise<KnowledgeEntry[]> {
    const chunks = chunkText(input.content);
    const created: KnowledgeEntry[] = [];
    for (let i = 0; i < chunks.length; i++) {
      created.push(
        await knowledgeRepo.insertEntry({
          organizationId: input.organizationId ?? null,
          standardId: input.standardId ?? null,
          domain: input.domain,
          title: chunks.length > 1 ? `${input.title} (${i + 1}/${chunks.length})` : input.title,
          content: chunks[i],
          language: input.language ?? 'en',
          metadata: input.metadata ?? {},
          chunkIndex: i,
          chunkCount: chunks.length,
        }),
      );
    }
    return created;
  },

  listEntries(filter: { domain?: KnowledgeDomain; standardId?: string; organizationId?: string | null; publishedOnly?: boolean } = {}) {
    return knowledgeRepo.listEntries(filter);
  },

  /** Lightweight keyword/ILIKE search over entries (used when embeddings absent). */
  async keywordSearch(params: {
    organizationId?: string | null;
    query: string;
    domains?: KnowledgeDomain[];
    limit?: number;
  }): Promise<KnowledgeEntry[]> {
    const terms = params.query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    if (!terms.length) return [];
    const where: string[] = [];
    const qparams: unknown[] = [];
    let i = 1;
    const ors = terms.map((t) => {
      qparams.push(`%${t}%`);
      return `(title ILIKE $${i} OR content ILIKE $${i})`;
    });
    i++;
    where.push(`(${ors.join(' AND ')})`);
    if (params.organizationId !== undefined) { where.push(`(organization_id = $${i++} OR organization_id IS NULL)`); qparams.push(params.organizationId); }
    if (params.domains?.length) { where.push(`domain = ANY($${i++})`); qparams.push(params.domains); }
    qparams.push(params.limit ?? 10);
    const sql = `SELECT * FROM knowledge_entries WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT $${i}`;
    const { rows } = await (await import('../../../db/pool.js')).query<any>(sql, qparams);
    return rows.map((r: any) => ({
      id: r.id,
      organizationId: r.organization_id,
      standardId: r.standard_id,
      clauseId: r.clause_id,
      domain: r.domain,
      title: r.title,
      content: r.content,
      language: r.language,
      metadata: r.metadata ?? {},
      chunkIndex: r.chunk_index,
      chunkCount: r.chunk_count,
      isPublished: r.is_published,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },
};
