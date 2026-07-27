/**
 * Knowledge Base repository — standards, clauses and indexed entries.
 */
import { query } from '../../../db/pool.js';
import type { KnowledgeCategory, KnowledgeClause, KnowledgeDomain, KnowledgeEntry, KnowledgeStandard } from './types.js';

function mapStandard(r: any): KnowledgeStandard {
  return {
    id: r.id,
    organizationId: r.organization_id,
    code: r.code,
    name: r.name,
    publisher: r.publisher,
    category: r.category,
    jurisdiction: r.jurisdiction,
    description: r.description,
    version: r.version,
    sourceUrl: r.source_url,
    isBuiltin: r.is_builtin,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapClause(r: any): KnowledgeClause {
  return {
    id: r.id,
    standardId: r.standard_id,
    parentId: r.parent_id,
    code: r.code,
    title: r.title,
    body: r.body,
    category: r.category,
    position: r.position,
  };
}

function mapEntry(r: any): KnowledgeEntry {
  return {
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
  };
}

export interface KnowledgeStandardFilter {
  category?: KnowledgeCategory;
  activeOnly?: boolean;
  search?: string;
}

export const knowledgeRepo = {
  // ----- Standards -----
  async upsertStandard(input: {
    organizationId?: string | null;
    code: string;
    name: string;
    publisher?: string | null;
    category?: KnowledgeCategory;
    jurisdiction?: string | null;
    description?: string | null;
    version?: string | null;
    sourceUrl?: string | null;
    isBuiltin?: boolean;
  }): Promise<KnowledgeStandard> {
    const { rows } = await query<any>(
      `INSERT INTO knowledge_standards
        (organization_id, code, name, publisher, category, jurisdiction, description, version, source_url, is_builtin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (organization_id, code) DO UPDATE SET
         name = EXCLUDED.name,
         publisher = EXCLUDED.publisher,
         category = EXCLUDED.category,
         jurisdiction = EXCLUDED.jurisdiction,
         description = EXCLUDED.description,
         version = EXCLUDED.version,
         source_url = EXCLUDED.source_url,
         updated_at = now()
       RETURNING *`,
      [
        input.organizationId ?? null,
        input.code,
        input.name,
        input.publisher ?? null,
        input.category ?? 'social',
        input.jurisdiction ?? null,
        input.description ?? null,
        input.version ?? null,
        input.sourceUrl ?? null,
        input.isBuiltin ?? false,
      ],
    );
    return mapStandard(rows[0]);
  },

  async listStandards(filter: KnowledgeStandardFilter = {}): Promise<KnowledgeStandard[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filter.activeOnly) where.push('is_active = TRUE');
    if (filter.category) { where.push(`category = $${i++}`); params.push(filter.category); }
    if (filter.search) { where.push(`(name ILIKE $${i} OR code ILIKE $${i} OR publisher ILIKE $${i})`); params.push(`%${filter.search}%`); i++; }
    const sql = `SELECT * FROM knowledge_standards ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY code`;
    const { rows } = await query<any>(sql, params);
    return rows.map(mapStandard);
  },

  async findStandardByCode(code: string, organizationId?: string | null): Promise<KnowledgeStandard | null> {
    const { rows } = await query<any>(
      `SELECT * FROM knowledge_standards WHERE code = $1 AND (organization_id = $2 OR organization_id IS NULL) ORDER BY organization_id NULLS LAST LIMIT 1`,
      [code, organizationId ?? null],
    );
    return rows[0] ? mapStandard(rows[0]) : null;
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    await query(`UPDATE knowledge_standards SET is_active = $2, updated_at = now() WHERE id = $1`, [id, isActive]);
  },

  // ----- Clauses -----
  async insertClause(input: {
    standardId: string;
    parentId?: string | null;
    code?: string | null;
    title: string;
    body: string;
    category?: string | null;
    position?: number;
  }): Promise<KnowledgeClause> {
    const { rows } = await query<any>(
      `INSERT INTO knowledge_clauses (standard_id, parent_id, code, title, body, category, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.standardId, input.parentId ?? null, input.code ?? null, input.title, input.body, input.category ?? null, input.position ?? 0],
    );
    return mapClause(rows[0]);
  },

  async listClauses(standardId: string): Promise<KnowledgeClause[]> {
    const { rows } = await query<any>(`SELECT * FROM knowledge_clauses WHERE standard_id = $1 ORDER BY position, code`, [standardId]);
    return rows.map(mapClause);
  },

  async clausesByStandard(standardId: string): Promise<KnowledgeClause[]> {
    return this.listClauses(standardId);
  },

  // ----- Entries -----
  async insertEntry(input: {
    organizationId?: string | null;
    standardId?: string | null;
    clauseId?: string | null;
    domain: KnowledgeDomain;
    title: string;
    content: string;
    language?: string;
    metadata?: Record<string, unknown>;
    chunkIndex?: number;
    chunkCount?: number;
    isPublished?: boolean;
  }): Promise<KnowledgeEntry> {
    const { rows } = await query<any>(
      `INSERT INTO knowledge_entries
        (organization_id, standard_id, clause_id, domain, title, content, language, metadata, chunk_index, chunk_count, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        input.organizationId ?? null,
        input.standardId ?? null,
        input.clauseId ?? null,
        input.domain,
        input.title,
        input.content,
        input.language ?? 'en',
        JSON.stringify(input.metadata ?? {}),
        input.chunkIndex ?? 0,
        input.chunkCount ?? 1,
        input.isPublished ?? true,
      ],
    );
    return mapEntry(rows[0]);
  },

  async listEntries(filter: { domain?: KnowledgeDomain; standardId?: string; organizationId?: string | null; publishedOnly?: boolean } = {}): Promise<KnowledgeEntry[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filter.domain) { where.push(`domain = $${i++}`); params.push(filter.domain); }
    if (filter.standardId) { where.push(`standard_id = $${i++}`); params.push(filter.standardId); }
    if (filter.organizationId !== undefined) { where.push(`(organization_id = $${i++} OR organization_id IS NULL)`); params.push(filter.organizationId); }
    if (filter.publishedOnly) where.push('is_published = TRUE');
    const sql = `SELECT * FROM knowledge_entries ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
    const { rows } = await query<any>(sql, params);
    return rows.map(mapEntry);
  },

  async deleteStandardEntries(standardId: string): Promise<void> {
    await query(`DELETE FROM knowledge_entries WHERE standard_id = $1`, [standardId]);
    await query(`DELETE FROM knowledge_clauses WHERE standard_id = $1`, [standardId]);
  },
};
