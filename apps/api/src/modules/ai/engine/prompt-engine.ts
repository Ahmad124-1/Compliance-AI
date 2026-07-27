/**
 * Prompt template engine.
 *
 * Minimal, dependency-free templating using `{{ variable }}` placeholders with
 * optional JSON-path access (e.g. `{{ context.supplier }}`). Supports defaults
 * via `{{ name | fallback }}` and a safe `forEach`/`join` helper through simple
 * string interpolation. Templates are versioned and stored in `ai_prompt_templates`.
 */
import { query } from '../../../db/pool.js';

export interface PromptVariables {
  [key: string]: unknown;
}

export class PromptRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptRenderError';
  }
}

/** Resolve a dotted path against a variables object. */
function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce<any>((acc, part) => {
    if (acc == null) return undefined;
    return acc[part];
  }, obj);
}

function renderToken(token: string, vars: PromptVariables): string {
  // {{ name }} or {{ name | default }}
  const inner = token.trim();
  const [rawName, ...def] = inner.split('|').map((s) => s.trim());
  const value = resolvePath(vars, rawName);
  if (value === undefined || value === null || value === '') {
    if (def.length) return def.join('|').trim();
    return '';
  }
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

const TOKEN_RE = /\{\{\s*([^}]+?)\s*\}\}/g;

export function renderTemplate(template: string, vars: PromptVariables): string {
  if (!template) return '';
  try {
    return template.replace(TOKEN_RE, (_m, expr: string) => renderToken(expr, vars));
  } catch (err) {
    throw new PromptRenderError(`Failed to render template: ${(err as Error).message}`);
  }
}

export interface PromptTemplateRecord {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  version: number;
  content: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(r: any): PromptTemplateRecord {
  return {
    id: r.id,
    organizationId: r.organization_id,
    key: r.key,
    name: r.name,
    description: r.description,
    category: r.category,
    version: r.version,
    content: r.content,
    variables: Array.isArray(r.variables) ? r.variables : [],
    isDefault: r.is_default,
    isActive: r.is_active,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const promptTemplateRepo = {
  async findByKey(organizationId: string, key: string): Promise<PromptTemplateRecord | null> {
    // Prefer an org-specific active template, else a built-in default.
    const { rows } = await query<any>(
      `SELECT * FROM ai_prompt_templates
       WHERE key = $1 AND is_active = TRUE
         AND (organization_id = $2 OR (organization_id IS NULL AND is_default = TRUE))
       ORDER BY organization_id NULLS LAST, version DESC LIMIT 1`,
      [key, organizationId],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async list(organizationId: string): Promise<PromptTemplateRecord[]> {
    const { rows } = await query<any>(
      `SELECT * FROM ai_prompt_templates
       WHERE organization_id = $1 OR (organization_id IS NULL AND is_default = TRUE)
       ORDER BY key, version DESC`,
      [organizationId],
    );
    return rows.map(mapRow);
  },

  async create(input: {
    organizationId: string;
    key: string;
    name: string;
    description?: string | null;
    category?: string;
    content: string;
    variables?: string[];
    createdBy?: string | null;
    isDefault?: boolean;
  }): Promise<PromptTemplateRecord> {
    // Bump version if a template with same key+org exists.
    const { rows: existing } = await query<{ version: number }>(
      `SELECT version FROM ai_prompt_templates WHERE organization_id = $1 AND key = $2 ORDER BY version DESC LIMIT 1`,
      [input.organizationId, input.key],
    );
    const version = (existing[0]?.version ?? 0) + 1;
    const { rows } = await query<any>(
      `INSERT INTO ai_prompt_templates
        (organization_id, key, name, description, category, version, content, variables, is_default, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        input.organizationId,
        input.key,
        input.name,
        input.description ?? null,
        input.category ?? 'general',
        version,
        input.content,
        JSON.stringify(input.variables ?? []),
        input.isDefault ?? false,
        input.createdBy ?? null,
      ],
    );
    return mapRow(rows[0]);
  },

  async update(id: string, patch: { name?: string; description?: string | null; content?: string; variables?: string[]; isActive?: boolean }): Promise<PromptTemplateRecord | null> {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    const set = (col: string, val: unknown) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.content !== undefined) set('content', patch.content);
    if (patch.variables !== undefined) set('variables', JSON.stringify(patch.variables));
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return null;
    sets.push(`updated_at = now()`);
    params.push(id);
    const { rows } = await query<any>(`UPDATE ai_prompt_templates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapRow(rows[0]) : null;
  },

  async remove(id: string): Promise<void> {
    await query(`DELETE FROM ai_prompt_templates WHERE id = $1`, [id]);
  },
};

/**
 * Resolve and render a prompt template by key, falling back to a literal
 * default when no template is configured.
 */
export async function renderPrompt(
  organizationId: string,
  key: string,
  vars: PromptVariables,
  fallback?: string,
): Promise<string> {
  const tpl = await promptTemplateRepo.findByKey(organizationId, key);
  if (tpl) return renderTemplate(tpl.content, vars);
  if (fallback !== undefined) return renderTemplate(fallback, vars);
  return renderTemplate(key in vars ? String(vars[key]) : '', vars);
}
