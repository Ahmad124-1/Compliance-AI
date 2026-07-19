// Assessment catalogue repositories (answer types, categories, tags, types).

import { query } from '../../../db/pool.js';
import {
  mapAnswerType,
  mapCategory,
  mapTag,
  mapType,
} from './assessment.mappers.js';
import type {
  AssessmentAnswerType,
  AssessmentCategory,
  AssessmentTag,
  AssessmentTypeCatalogue,
} from '../types.js';

export const answerTypeRepo = {
  async list(organizationId: string, activeOnly = true): Promise<AssessmentAnswerType[]> {
    const { rows } = await query(
      `SELECT * FROM assessment_answer_types WHERE organization_id = $1 ${activeOnly ? 'AND is_active = TRUE' : ''} ORDER BY label`,
      [organizationId],
    );
    return rows.map(mapAnswerType);
  },
  async create(organizationId: string, input: Partial<AssessmentAnswerType> & { key: string; label: string }): Promise<AssessmentAnswerType> {
    const { rows } = await query(
      `INSERT INTO assessment_answer_types (organization_id, key, label, description, has_options, supports_validation, is_builtin)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [organizationId, input.key, input.label, input.description ?? null, input.hasOptions ?? false, input.supportsValidation ?? true, input.isBuiltin ?? false],
    );
    return mapAnswerType(rows[0]);
  },
  async ensureBuiltins(organizationId: string): Promise<void> {
    const builtins: { key: string; label: string; hasOptions: boolean }[] = [
      { key: 'short_text', label: 'Short Text', hasOptions: false },
      { key: 'long_text', label: 'Long Text', hasOptions: false },
      { key: 'number', label: 'Number', hasOptions: false },
      { key: 'currency', label: 'Currency', hasOptions: false },
      { key: 'percentage', label: 'Percentage', hasOptions: false },
      { key: 'date', label: 'Date', hasOptions: false },
      { key: 'time', label: 'Time', hasOptions: false },
      { key: 'datetime', label: 'Date & Time', hasOptions: false },
      { key: 'dropdown', label: 'Dropdown', hasOptions: true },
      { key: 'multiselect', label: 'Multi Select', hasOptions: true },
      { key: 'checkbox', label: 'Checkbox', hasOptions: true },
      { key: 'radio', label: 'Radio Button', hasOptions: true },
      { key: 'yes_no', label: 'Yes / No', hasOptions: true },
      { key: 'pass_fail', label: 'Pass / Fail', hasOptions: true },
      { key: 'file', label: 'File Upload', hasOptions: false },
      { key: 'image', label: 'Image Upload', hasOptions: false },
      { key: 'video', label: 'Video Upload', hasOptions: false },
      { key: 'audio', label: 'Audio Upload', hasOptions: false },
      { key: 'signature', label: 'Signature', hasOptions: false },
      { key: 'rating', label: 'Rating', hasOptions: false },
      { key: 'risk_matrix', label: 'Risk Matrix', hasOptions: false },
      { key: 'table', label: 'Table', hasOptions: false },
      { key: 'location', label: 'Location', hasOptions: false },
    ];
    for (const b of builtins) {
      await query(
        `INSERT INTO assessment_answer_types (organization_id, key, label, has_options, supports_validation, is_builtin, is_active)
         VALUES ($1,$2,$3,$4,TRUE,TRUE,TRUE) ON CONFLICT (organization_id, key) DO NOTHING`,
        [organizationId, b.key, b.label, b.hasOptions],
      );
    }
  },
};

export const categoryRepo = {
  async list(organizationId: string, activeOnly = true): Promise<AssessmentCategory[]> {
    const { rows } = await query(
      `SELECT * FROM assessment_categories WHERE organization_id = $1 ${activeOnly ? 'AND is_active = TRUE' : ''} ORDER BY position, name`,
      [organizationId],
    );
    return rows.map(mapCategory);
  },
  async create(organizationId: string, input: { name: string; code?: string | null; description?: string | null; color?: string | null; position?: number }): Promise<AssessmentCategory> {
    const { rows } = await query(
      `INSERT INTO assessment_categories (organization_id, name, code, description, color, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [organizationId, input.name, input.code ?? null, input.description ?? null, input.color ?? null, input.position ?? 0],
    );
    return mapCategory(rows[0]);
  },
  async update(id: string, patch: Partial<AssessmentCategory>): Promise<AssessmentCategory | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.color !== undefined) set('color', patch.color);
    if (patch.position !== undefined) set('position', patch.position);
    if (patch.isActive !== undefined) set('is_active', patch.isActive);
    if (!sets.length) return this.findById(id);
    params.push(id);
    const { rows } = await query(`UPDATE assessment_categories SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapCategory(rows[0]) : null;
  },
  async findById(id: string): Promise<AssessmentCategory | null> {
    const { rows } = await query(`SELECT * FROM assessment_categories WHERE id = $1`, [id]);
    return rows[0] ? mapCategory(rows[0]) : null;
  },
  async remove(id: string): Promise<void> {
    await query(`DELETE FROM assessment_categories WHERE id = $1`, [id]);
  },
};

export const tagRepo = {
  async list(organizationId: string): Promise<AssessmentTag[]> {
    const { rows } = await query(`SELECT * FROM assessment_tags WHERE organization_id = $1 ORDER BY name`, [organizationId]);
    return rows.map(mapTag);
  },
  async upsert(organizationId: string, name: string): Promise<AssessmentTag> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { rows } = await query(
      `INSERT INTO assessment_tags (organization_id, name, slug) VALUES ($1,$2,$3)
       ON CONFLICT (organization_id, slug) DO UPDATE SET name = EXCLUDED.name RETURNING *`,
      [organizationId, name, slug],
    );
    return mapTag(rows[0]);
  },
};

export const assessmentTypeRepo = {
  async list(organizationId: string, activeOnly = true): Promise<AssessmentTypeCatalogue[]> {
    const { rows } = await query(
      `SELECT * FROM assessment_types WHERE organization_id = $1 ${activeOnly ? 'AND is_active = TRUE' : ''} ORDER BY type`,
      [organizationId],
    );
    return rows.map(mapType);
  },
  async ensureBuiltins(organizationId: string): Promise<void> {
    const builtins: { type: string; label: string }[] = [
      { type: 'internal', label: 'Internal Assessment' },
      { type: 'supplier', label: 'Supplier Assessment' },
      { type: 'factory', label: 'Factory Assessment' },
      { type: 'self', label: 'Self Assessment' },
      { type: 'customer', label: 'Customer Assessment' },
      { type: 'pre_audit', label: 'Pre Audit Assessment' },
      { type: 'follow_up', label: 'Follow Up Assessment' },
      { type: 'custom', label: 'Custom Assessment' },
    ];
    for (const b of builtins) {
      await query(
        `INSERT INTO assessment_types (organization_id, type, label, is_system, is_active)
         VALUES ($1,$2,$3,TRUE,TRUE) ON CONFLICT (organization_id, type) DO NOTHING`,
        [organizationId, b.type, b.label],
      );
    }
  },
};
