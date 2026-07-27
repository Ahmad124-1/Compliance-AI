/**
 * Vector search engine (pgvector).
 *
 * Stores embeddings for any source type (knowledge entries, policies, audits,
 * CAPAs, grievances, evidence, suppliers) and performs cosine-similarity
 * semantic search across the six mandated domains: policy, audit, capa,
 * grievance, evidence, supplier.
 */
import { query } from '../../../db/pool.js';

export type VectorDomain = 'policy' | 'audit' | 'capa' | 'grievance' | 'evidence' | 'supplier';
export type VectorSourceType = 'knowledge_entry' | 'policy' | 'audit' | 'capa' | 'grievance' | 'evidence' | 'supplier';

export interface EmbeddingRecord {
  id: string;
  organizationId: string | null;
  sourceType: VectorSourceType;
  sourceId: string;
  domain: VectorDomain;
  model: string;
  chunkIndex: number;
  content: string;
  tokens: number;
  createdAt: Date;
}

export interface VectorSearchHit {
  id: string;
  sourceType: VectorSourceType;
  sourceId: string;
  domain: VectorDomain;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

function mapRow(r: any): EmbeddingRecord {
  return {
    id: r.id,
    organizationId: r.organization_id,
    sourceType: r.source_type,
    sourceId: r.source_id,
    domain: r.domain,
    model: r.model,
    chunkIndex: r.chunk_index,
    content: r.content,
    tokens: r.tokens,
    createdAt: r.created_at,
  };
}

export const vectorRepo = {
  async upsert(input: {
    organizationId?: string | null;
    sourceType: VectorSourceType;
    sourceId: string;
    domain: VectorDomain;
    model: string;
    content: string;
    embedding: number[];
    chunkIndex?: number;
    tokens?: number;
  }): Promise<EmbeddingRecord> {
    const { rows } = await query<any>(
      `INSERT INTO ai_embeddings
        (organization_id, source_type, source_id, domain, model, chunk_index, content, embedding, tokens)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         embedding = EXCLUDED.embedding, content = EXCLUDED.content,
         model = EXCLUDED.model, tokens = EXCLUDED.tokens, updated_at = now()
       RETURNING *`,
      [
        input.organizationId ?? null,
        input.sourceType,
        input.sourceId,
        input.domain,
        input.model,
        input.chunkIndex ?? 0,
        input.content,
        `[${input.embedding.join(',')}]`,
        input.tokens ?? 0,
      ],
    );
    return mapRow(rows[0]);
  },

  /** Delete all embeddings for a given source (used when an entity is re-indexed). */
  async deleteBySource(sourceType: VectorSourceType, sourceId: string): Promise<void> {
    await query(`DELETE FROM ai_embeddings WHERE source_type = $1 AND source_id = $2`, [sourceType, sourceId]);
  },

  /**
   * Cosine-similarity nearest-neighbour search.
   * @param embedding query vector
   * @param opts organization scoping, domain filters, min score, limit
   */
  async search(embedding: number[], opts: {
    organizationId?: string | null;
    domains?: VectorDomain[];
    sourceTypes?: VectorSourceType[];
    minScore?: number;
    limit?: number;
    includeMetadata?: boolean;
  } = {}): Promise<VectorSearchHit[]> {
    const where: string[] = ['1 - (embedding <=> $1) >= $2'];
    const params: unknown[] = [`[${embedding.join(',')}]`, opts.minScore ?? 0];
    let i = 3;
    if (opts.organizationId !== undefined) {
      where.push(`(organization_id = $${i++} OR organization_id IS NULL)`);
      params.push(opts.organizationId);
    }
    if (opts.domains?.length) { where.push(`domain = ANY($${i++})`); params.push(opts.domains); }
    if (opts.sourceTypes?.length) { where.push(`source_type = ANY($${i++})`); params.push(opts.sourceTypes); }
    params.push(opts.limit ?? 8);

    const metaJoin = opts.includeMetadata
      ? `, COALESCE(ke.metadata, p.metadata, NULL) AS metadata`
      : `, NULL AS metadata`;
    const join = opts.includeMetadata
      ? ` LEFT JOIN knowledge_entries ke ON e.source_type = 'knowledge_entry' AND ke.id = e.source_id::text
          LEFT JOIN (SELECT id, metadata FROM policies) p ON e.source_type = 'policy' AND p.id = e.source_id::text`
      : '';

    const sql = `SELECT e.id, e.source_type, e.source_id, e.domain, e.content, (1 - (e.embedding <=> $1)) AS score ${metaJoin}
       FROM ai_embeddings e ${join}
       WHERE ${where.join(' AND ')}
       ORDER BY e.embedding <=> $1
       LIMIT $${i}`;
    const { rows } = await query<any>(sql, params);
    return rows.map((r: any) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      domain: r.domain,
      content: r.content,
      score: Number(r.score),
      metadata: r.metadata ?? {},
    }));
  },

  async countByOrg(organizationId: string): Promise<number> {
    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ai_embeddings WHERE organization_id = $1 OR organization_id IS NULL`,
      [organizationId],
    );
    return Number(rows[0]?.count ?? 0);
  },
};
