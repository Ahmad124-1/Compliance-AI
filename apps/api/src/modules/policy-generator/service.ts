import { randomUUID } from 'node:crypto';

import { audit } from '../../core/audit.js';
import { NotFoundError, BadRequestError } from '../../core/errors.js';
import { query } from '../../db/pool.js';
import { createRegistry, resolveCredentials } from '../ai/engine/registry.js';
import { aiConfigRepo } from '../ai/engine/config.repo.js';
import { renderPrompt } from '../ai/engine/prompt-engine.js';
import { tokenLedgerRepo } from '../ai/engine/token-ledger.repo.js';
import { AiDisabledError } from '../ai/engine/providers/null.provider.js';
import type { ChatMessage, CompletionResult } from '../ai/engine/types.js';

export interface PolicyRecord {
  id: string;
  organizationId: string;
  title: string;
  type: string;
  content: string;
  version: number;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const policyGeneratorService = {
  async generatePolicy(organizationId: string, userId: string | null, type: string, context: Record<string, unknown>): Promise<PolicyRecord> {
    const config = await aiConfigRepo.get(organizationId);
    const registry = createRegistry(config, { ...resolveCredentials(), organizationId, userId });

    const systemPrompt = await renderPrompt(organizationId, 'policy_generator.generate', {
      type,
      context: JSON.stringify(context),
    }, `You are ComplianceOS AI Policy Generator. Generate a comprehensive policy document for the specified type based on the provided context. Return JSON with "title" and "content" fields. The content should be well-structured with headings, sections, and clear language.`);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Policy type: ${type}\n\nContext: ${JSON.stringify(context)}` },
    ];

    let result: CompletionResult;
    try {
      result = await registry.withFallback((p) => p.complete(messages, {
        organizationId,
        userId,
        model: config.model,
        temperature: 0.3,
        maxTokens: 4096,
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

    let parsed: { title: string; content: string } = { title: `${type} Policy`, content: result.text };
    try {
      const maybe = JSON.parse(result.text);
      if (maybe && typeof maybe === 'object' && typeof (maybe as any).title === 'string' && typeof (maybe as any).content === 'string') {
        parsed = maybe as { title: string; content: string };
      }
    } catch {
      // keep default
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const policy: PolicyRecord = {
      id,
      organizationId,
      title: parsed.title,
      type,
      content: parsed.content,
      version: 1,
      status: 'draft',
      approvedBy: null,
      approvedAt: null,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await query(
      `INSERT INTO ai_policies (id, organization_id, title, type, content, version, status, approved_by, approved_at, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [id, organizationId, policy.title, type, policy.content, 1, 'draft', null, null, userId, now, now],
    );

    await tokenLedgerRepo.recordCompletion({
      organizationId,
      userId,
      provider: result.provider,
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    });

    await audit({ organizationId, actorId: userId ?? null, action: 'policy.generate', entity: 'ai_policy', entityId: id, metadata: { type } });

    return policy;
  },

  async listPolicies(organizationId: string): Promise<PolicyRecord[]> {
    const { rows } = await query<Record<string, any>>(
      `SELECT * FROM ai_policies WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organizationId],
    );
    return rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      title: r.title,
      type: r.type,
      content: r.content,
      version: r.version,
      status: r.status,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async getPolicy(id: string): Promise<PolicyRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM ai_policies WHERE id = $1`, [id]);
    const row = rows[0];
    if (!row) throw new NotFoundError('Policy not found');
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      type: row.type,
      content: row.content,
      version: row.version,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updatePolicy(id: string, patch: Partial<Pick<PolicyRecord, 'title' | 'content' | 'type'>>): Promise<PolicyRecord> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.content !== undefined) set('content', patch.content);
    if (patch.type !== undefined) set('type', patch.type);
    if (!sets.length) return this.getPolicy(id);
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query<any>(`UPDATE ai_policies SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    const r = rows[0];
    return {
      id: r.id,
      organizationId: r.organization_id,
      title: r.title,
      type: r.type,
      content: r.content,
      version: r.version,
      status: r.status,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async approvePolicy(id: string, userId: string | null): Promise<PolicyRecord> {
    const policy = await this.getPolicy(id);
    if (policy.status === 'approved') return policy;

    const now = new Date().toISOString();
    const { rows } = await query<any>(
      `UPDATE ai_policies SET status = 'approved', approved_by = $2, approved_at = $3, updated_at = $4 WHERE id = $1 RETURNING *`,
      [id, userId, now, now],
    );
    const r = rows[0];
    await audit({ organizationId: r.organization_id, actorId: userId ?? null, action: 'policy.approve', entity: 'ai_policy', entityId: id });
    return {
      id: r.id,
      organizationId: r.organization_id,
      title: r.title,
      type: r.type,
      content: r.content,
      version: r.version,
      status: r.status,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async rejectPolicy(id: string, userId: string | null, reason: string): Promise<PolicyRecord> {
    const policy = await this.getPolicy(id);
    if (policy.status === 'rejected') return policy;

    const now = new Date().toISOString();
    const { rows } = await query<any>(
      `UPDATE ai_policies SET status = 'rejected', updated_at = $2 WHERE id = $1 RETURNING *`,
      [id, now],
    );
    const r = rows[0];
    await audit({ organizationId: r.organization_id, actorId: userId ?? null, action: 'policy.reject', entity: 'ai_policy', entityId: id, metadata: { reason } });
    return {
      id: r.id,
      organizationId: r.organization_id,
      title: r.title,
      type: r.type,
      content: r.content,
      version: r.version,
      status: r.status,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async exportPolicy(id: string, format: string): Promise<{ format: string; title: string; content: string; exportedAt: string }> {
    const policy = await this.getPolicy(id);

    let content: string;
    switch (format) {
      case 'pdf':
      case 'docx':
      case 'html':
        content = `<!DOCTYPE html><html><head><title>${policy.title}</title><style>body{font-family:ui-sans-serif,system-ui;padding:24px;line-height:1.6} h1{color:#1a1a1a} h2{color:#333} p{color:#444}</style></head><body><h1>${policy.title}</h1><p><strong>Type:</strong> ${policy.type}</p><p><strong>Version:</strong> ${policy.version}</p><p><strong>Status:</strong> ${policy.status}</p><hr><pre style="white-space:pre-wrap;font-family:ui-sans-serif,system-ui">${policy.content}</pre></body></html>`;
        break;
      case 'markdown':
      case 'md':
      default:
        content = `# ${policy.title}\n\n**Type:** ${policy.type}\n**Version:** ${policy.version}\n**Status:** ${policy.status}\n\n---\n\n${policy.content}`;
        break;
    }

    await audit({ organizationId: policy.organizationId, actorId: policy.createdBy ?? null, action: 'policy.export', entity: 'ai_policy', entityId: id, metadata: { format } });

    return {
      format: format === 'docx' ? 'html' : format,
      title: policy.title,
      content,
      exportedAt: new Date().toISOString(),
    };
  },
};
