/**
 * AI Memory store.
 *
 * Maintains four memory scopes used to ground RAG and chat:
 *   - conversation : per-thread turns (system/user/assistant)
 *   - organization : org-level facts, preferences, SOPs
 *   - supplier      : per-supplier history and risk notes
 *   - audit        : per-audit history and findings
 *
 * Memory is read back as context and (optionally) embedded for retrieval.
 */
import { query } from '../../../db/pool.js';

export type MemoryScope = 'conversation' | 'organization' | 'supplier' | 'audit';
export type MemoryRole = 'system' | 'user' | 'assistant' | 'note';

export interface MemoryRecord {
  id: string;
  organizationId: string;
  scope: MemoryScope;
  scopeId: string | null;
  role: MemoryRole;
  content: string;
  tokens: number;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
}

function mapRow(r: any): MemoryRecord {
  return {
    id: r.id,
    organizationId: r.organization_id,
    scope: r.scope,
    scopeId: r.scope_id,
    role: r.role,
    content: r.content,
    tokens: Number(r.tokens),
    metadata: r.metadata ?? {},
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil((text?.length ?? 0) / 4));
}

export const memoryRepo = {
  async append(input: {
    organizationId: string;
    scope: MemoryScope;
    scopeId?: string | null;
    role: MemoryRole;
    content: string;
    createdBy?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<MemoryRecord> {
    const { rows } = await query<any>(
      `INSERT INTO ai_memory (organization_id, scope, scope_id, role, content, tokens, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        input.organizationId,
        input.scope,
        input.scopeId ?? null,
        input.role,
        input.content,
        estimateTokens(input.content),
        JSON.stringify(input.metadata ?? {}),
        input.createdBy ?? null,
      ],
    );
    return mapRow(rows[0]);
  },

  /** Recent memory for a scope, newest last. */
  async get(scope: MemoryScope, organizationId: string, scopeId?: string | null, limit = 50): Promise<MemoryRecord[]> {
    const { rows } = await query<any>(
      `SELECT * FROM ai_memory
       WHERE scope = $1 AND organization_id = $2 AND (scope_id = $3 OR ($3::uuid IS NULL AND scope_id IS NULL))
       ORDER BY created_at ASC LIMIT $4`,
      [scope, organizationId, scopeId ?? null, limit],
    );
    return rows.map(mapRow);
  },

  /** Compact a conversation into a short summary note (replaces verbose turns). */
  async summarizeConversation(organizationId: string, conversationId: string): Promise<string> {
    const { rows } = await query<any>(
      `SELECT string_agg(content, E'\n') AS text FROM ai_memory
       WHERE scope = 'conversation' AND organization_id = $1 AND scope_id = $2 AND role = 'user'`,
      [organizationId, conversationId],
    );
    return rows[0]?.text ?? '';
  },

  async clearScope(scope: MemoryScope, organizationId: string, scopeId?: string | null): Promise<number> {
    const { rowCount } = await query(
      `DELETE FROM ai_memory WHERE scope = $1 AND organization_id = $2 AND (scope_id = $3 OR ($3::uuid IS NULL AND scope_id IS NULL))`,
      [scope, organizationId, scopeId ?? null],
    );
    return rowCount ?? 0;
  },

  /** Build a chat-message array from conversation memory. */
  async toMessages(organizationId: string, conversationId: string, systemPrompt?: string): Promise<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>> {
    const mem = await this.get('conversation', organizationId, conversationId);
    const msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    for (const m of mem) {
      if (m.role === 'system') {
        if (!systemPrompt) msgs.unshift({ role: 'system', content: m.content });
      } else if (m.role === 'user' || m.role === 'assistant') {
        msgs.push({ role: m.role, content: m.content });
      }
    }
    return msgs;
  },
};
