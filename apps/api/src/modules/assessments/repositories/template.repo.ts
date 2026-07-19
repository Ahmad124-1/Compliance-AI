// Assessment template repository — builder persistence (templates, sections,
// questions, options, conditions, dependencies, scoring/validation rules, mappings).

import { query, withTransaction } from '../../../db/pool.js';
import {
  mapTemplate,
  mapSection,
  mapQuestion,
  mapOption,
  mapCondition,
  mapDependency,
  mapTemplateVersion,
} from './assessment.mappers.js';
import type {
  AssessmentTemplate,
  AssessmentSection,
  AssessmentQuestion,
  AssessmentAnswerOption,
  AssessmentCondition,
  AssessmentDependency,
  AssessmentTemplateVersion,
  AssessmentTemplateFilters,
  Paginated,
  FrameworkMappingInput,
  ControlMappingInput,
} from '../types.js';

export const templateRepo = {
  // ---- Templates ----------------------------------------------------------
  async create(organizationId: string, input: Partial<AssessmentTemplate> & { title: string; type: string }): Promise<AssessmentTemplate> {
    const { rows } = await query<AssessmentTemplate & any>(
      `INSERT INTO assessment_templates
        (organization_id, code, title, description, type, category_id, version, status, is_published,
         parent_template_id, latest_version_id, default_language, estimated_duration_minutes, instructions,
         scoring_config, settings, tags, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,1,'draft',FALSE,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        organizationId, input.code ?? null, input.title, input.description ?? null, input.type, input.categoryId ?? null,
        input.parentTemplateId ?? null, input.latestVersionId ?? null, input.defaultLanguage ?? 'en',
        input.estimatedDurationMinutes ?? null, input.instructions ?? null,
        JSON.stringify(input.scoringConfig ?? {}), JSON.stringify(input.settings ?? {}), JSON.stringify(input.tags ?? []),
        input.createdBy ?? null, input.updatedBy ?? null,
      ],
    );
    return mapTemplate(rows[0]);
  },

  async findById(id: string, organizationId?: string): Promise<AssessmentTemplate | null> {
    const sql = `SELECT t.*, c.name AS category_name, c.code AS category_code, c.color AS category_color
                 FROM assessment_templates t LEFT JOIN assessment_categories c ON c.id = t.category_id WHERE t.id = $1`;
    const params: unknown[] = [id];
    if (organizationId) { params.push(organizationId); }
    const { rows } = await query(sql + (organizationId ? ' AND t.organization_id = $2' : ''), params);
    return rows[0] ? mapTemplate(rows[0]) : null;
  },

  async list(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<AssessmentTemplate>> {
    const where: string[] = ['t.organization_id = $1', 't.is_archived = FALSE', '(t.latest_version_id IS NULL OR t.latest_version_id = t.id)'];
    const params: unknown[] = [organizationId];
    let i = 2;
    if (filters.search) { where.push(`(t.title ILIKE $${i} OR t.code ILIKE $${i} OR t.description ILIKE $${i})`); params.push(`%${filters.search}%`); i++; }
    if (filters.type) { where.push(`t.type = $${i++}`); params.push(filters.type); }
    if (filters.categoryId) { where.push(`t.category_id = $${i++}`); params.push(filters.categoryId); }
    if (filters.status) { where.push(`t.status = $${i++}`); params.push(filters.status); }
    if (filters.tag) { where.push(`$${i} = ANY(t.tags)`); params.push(filters.tag); i++; }
    const sortCol = filters.sort === 'title' ? 't.title' : filters.sort === 'updated_at' ? 't.updated_at' : filters.sort === 'created_at' ? 't.created_at' : 't.updated_at';
    const dir = filters.order === 'asc' ? 'ASC' : 'DESC';
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 20));
    const { rows: countRows } = await query<{ total: string }>(`SELECT COUNT(*) AS total FROM assessment_templates t WHERE ${where.join(' AND ')}`, params);
    const total = parseInt(countRows[0]?.total ?? '0', 10);
    const { rows } = await query<AssessmentTemplate & any>(
      `SELECT t.*, c.name AS category_name, c.code AS category_code, c.color AS category_color
       FROM assessment_templates t LEFT JOIN assessment_categories c ON c.id = t.category_id
       WHERE ${where.join(' AND ')} ORDER BY ${sortCol} ${dir} LIMIT $${i++} OFFSET $${i++}`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { data: rows.map(mapTemplate), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async update(id: string, organizationId: string, patch: Partial<AssessmentTemplate>): Promise<AssessmentTemplate | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.type !== undefined) set('type', patch.type);
    if (patch.categoryId !== undefined) set('category_id', patch.categoryId);
    if (patch.status !== undefined) set('status', patch.status);
    if (patch.isPublished !== undefined) set('is_published', patch.isPublished);
    if (patch.defaultLanguage !== undefined) set('default_language', patch.defaultLanguage);
    if (patch.estimatedDurationMinutes !== undefined) set('estimated_duration_minutes', patch.estimatedDurationMinutes);
    if (patch.instructions !== undefined) set('instructions', patch.instructions);
    if (patch.scoringConfig !== undefined) set('scoring_config', JSON.stringify(patch.scoringConfig));
    if (patch.settings !== undefined) set('settings', JSON.stringify(patch.settings));
    if (patch.tags !== undefined) set('tags', JSON.stringify(patch.tags));
    if (patch.updatedBy !== undefined) set('updated_by', patch.updatedBy);
    if (!sets.length) return this.findById(id, organizationId);
    params.push(id, organizationId);
    const { rows } = await query(`UPDATE assessment_templates SET ${sets.join(', ')} WHERE id = $${i} AND organization_id = $${i + 1} RETURNING *`, params);
    return rows[0] ? mapTemplate(rows[0]) : null;
  },

  async archive(id: string, organizationId: string, actorId?: string | null): Promise<AssessmentTemplate | null> {
    const { rows } = await query(
      `UPDATE assessment_templates SET is_archived = TRUE, status = 'archived', archived_at = now(), archived_by = $3, updated_at = now()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId, actorId ?? null],
    );
    return rows[0] ? mapTemplate(rows[0]) : null;
  },

  async restore(id: string, organizationId: string): Promise<AssessmentTemplate | null> {
    const { rows } = await query(
      `UPDATE assessment_templates SET is_archived = FALSE, status = 'draft', archived_at = NULL, archived_by = NULL, updated_at = now()
       WHERE id = $1 AND organization_id = $2 RETURNING *`,
      [id, organizationId],
    );
    return rows[0] ? mapTemplate(rows[0]) : null;
  },

  async remove(id: string, organizationId: string): Promise<void> {
    await query(`DELETE FROM assessment_templates WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
  },

  // ---- Sections -----------------------------------------------------------
  async createSection(templateId: string, input: Partial<AssessmentSection> & { title: string; position: number }): Promise<AssessmentSection> {
    const { rows } = await query<AssessmentSection & any>(
      `INSERT INTO assessment_sections (template_id, parent_section_id, title, description, code, guidance, position, weight, is_required, collapse_by_default, conditional_logic, visibility_rules)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        templateId, input.parentSectionId ?? null, input.title, input.description ?? null, input.code ?? null, input.guidance ?? null,
        input.position, input.weight ?? 1, input.isRequired ?? true, input.collapseByDefault ?? false,
        JSON.stringify(input.conditionalLogic ?? null), JSON.stringify(input.visibilityRules ?? null),
      ],
    );
    return mapSection(rows[0]);
  },

  async listSections(templateId: string): Promise<AssessmentSection[]> {
    const { rows } = await query(`SELECT * FROM assessment_sections WHERE template_id = $1 ORDER BY position, title`, [templateId]);
    return rows.map(mapSection);
  },

  async updateSection(id: string, patch: Partial<AssessmentSection>): Promise<AssessmentSection | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.parentSectionId !== undefined) set('parent_section_id', patch.parentSectionId);
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.description !== undefined) set('description', patch.description);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.guidance !== undefined) set('guidance', patch.guidance);
    if (patch.position !== undefined) set('position', patch.position);
    if (patch.weight !== undefined) set('weight', patch.weight);
    if (patch.isRequired !== undefined) set('is_required', patch.isRequired);
    if (patch.collapseByDefault !== undefined) set('collapse_by_default', patch.collapseByDefault);
    if (patch.conditionalLogic !== undefined) set('conditional_logic', JSON.stringify(patch.conditionalLogic));
    if (patch.visibilityRules !== undefined) set('visibility_rules', JSON.stringify(patch.visibilityRules));
    if (!sets.length) return this.findSection(id);
    params.push(id);
    const { rows } = await query(`UPDATE assessment_sections SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapSection(rows[0]) : null;
  },

  async findSection(id: string): Promise<AssessmentSection | null> {
    const { rows } = await query(`SELECT * FROM assessment_sections WHERE id = $1`, [id]);
    return rows[0] ? mapSection(rows[0]) : null;
  },

  async removeSection(id: string): Promise<void> {
    await query(`DELETE FROM assessment_sections WHERE id = $1`, [id]);
  },

  // ---- Questions & options ------------------------------------------------
  async createQuestion(templateId: string, input: Partial<AssessmentQuestion> & { sectionId?: string | null; label: string; answerTypeKey: string; position: number }): Promise<AssessmentQuestion> {
    const { rows } = await query<AssessmentQuestion & any>(
      `INSERT INTO assessment_questions
        (template_id, section_id, parent_question_id, group_id, code, label, help_text, answer_type_id, answer_type_key,
         position, weight, is_required, allows_multiple, max_selections, scoring_config, validation_rules,
         conditional_logic, visibility_rules, dependency_rules, framework_mappings, control_mappings, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING *`,
      [
        templateId, input.sectionId ?? null, input.parentQuestionId ?? null, input.groupId ?? null, input.code ?? null,
        input.label, input.helpText ?? null, input.answerTypeId ?? null, input.answerTypeKey,
        input.position, input.weight ?? 1, input.isRequired ?? false, input.allowsMultiple ?? false, input.maxSelections ?? null,
        JSON.stringify(input.scoringConfig ?? {}), JSON.stringify(input.validationRules ?? {}),
        JSON.stringify(input.conditionalLogic ?? null), JSON.stringify(input.visibilityRules ?? null),
        JSON.stringify(input.dependencyRules ?? null), JSON.stringify(input.frameworkMappings ?? []),
        JSON.stringify(input.controlMappings ?? []), JSON.stringify(input.metadata ?? {}),
      ],
    );
    return mapQuestion(rows[0]);
  },

  async listQuestions(templateId: string): Promise<AssessmentQuestion[]> {
    const { rows } = await query<AssessmentQuestion & any>(`SELECT * FROM assessment_questions WHERE template_id = $1 ORDER BY position`, [templateId]);
    return rows.map(mapQuestion);
  },

  async listOptions(questionId: string): Promise<AssessmentAnswerOption[]> {
    const { rows } = await query(`SELECT * FROM assessment_question_options WHERE question_id = $1 ORDER BY position`, [questionId]);
    return rows.map(mapOption);
  },

  async updateQuestion(id: string, patch: Partial<AssessmentQuestion>): Promise<AssessmentQuestion | null> {
    const sets: string[] = []; const params: unknown[] = []; let i = 1;
    const set = (c: string, v: unknown) => { sets.push(`${c} = $${i++}`); params.push(v); };
    if (patch.sectionId !== undefined) set('section_id', patch.sectionId);
    if (patch.parentQuestionId !== undefined) set('parent_question_id', patch.parentQuestionId);
    if (patch.groupId !== undefined) set('group_id', patch.groupId);
    if (patch.code !== undefined) set('code', patch.code);
    if (patch.label !== undefined) set('label', patch.label);
    if (patch.helpText !== undefined) set('help_text', patch.helpText);
    if (patch.answerTypeId !== undefined) set('answer_type_id', patch.answerTypeId);
    if (patch.answerTypeKey !== undefined) set('answer_type_key', patch.answerTypeKey);
    if (patch.position !== undefined) set('position', patch.position);
    if (patch.weight !== undefined) set('weight', patch.weight);
    if (patch.isRequired !== undefined) set('is_required', patch.isRequired);
    if (patch.allowsMultiple !== undefined) set('allows_multiple', patch.allowsMultiple);
    if (patch.maxSelections !== undefined) set('max_selections', patch.maxSelections);
    if (patch.scoringConfig !== undefined) set('scoring_config', JSON.stringify(patch.scoringConfig));
    if (patch.validationRules !== undefined) set('validation_rules', JSON.stringify(patch.validationRules));
    if (patch.conditionalLogic !== undefined) set('conditional_logic', JSON.stringify(patch.conditionalLogic));
    if (patch.visibilityRules !== undefined) set('visibility_rules', JSON.stringify(patch.visibilityRules));
    if (patch.dependencyRules !== undefined) set('dependency_rules', JSON.stringify(patch.dependencyRules));
    if (patch.frameworkMappings !== undefined) set('framework_mappings', JSON.stringify(patch.frameworkMappings));
    if (patch.controlMappings !== undefined) set('control_mappings', JSON.stringify(patch.controlMappings));
    if (patch.metadata !== undefined) set('metadata', JSON.stringify(patch.metadata));
    if (!sets.length) return this.findQuestion(id);
    params.push(id);
    const { rows } = await query(`UPDATE assessment_questions SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, params);
    return rows[0] ? mapQuestion(rows[0]) : null;
  },

  async findQuestion(id: string): Promise<AssessmentQuestion | null> {
    const { rows } = await query(`SELECT * FROM assessment_questions WHERE id = $1`, [id]);
    return rows[0] ? mapQuestion(rows[0]) : null;
  },

  async removeQuestion(id: string): Promise<void> {
    await query(`DELETE FROM assessment_questions WHERE id = $1`, [id]);
  },

  async replaceOptions(questionId: string, options: { label: string; value: string; position: number; score?: number; description?: string | null; isDefault?: boolean; conditionalLogic?: unknown; metadata?: Record<string, unknown> }[]): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(`DELETE FROM assessment_question_options WHERE question_id = $1`, [questionId]);
      for (const o of options) {
        await client.query(
          `INSERT INTO assessment_question_options (question_id, label, value, position, score, description, is_default, conditional_logic, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [questionId, o.label, o.value, o.position, o.score ?? 0, o.description ?? null, o.isDefault ?? false, JSON.stringify(o.conditionalLogic ?? null), JSON.stringify(o.metadata ?? {})],
        );
      }
    });
  },

  // ---- Conditions & dependencies -----------------------------------------
  async createCondition(organizationId: string, input: { templateId?: string | null; name?: string | null; description?: string | null; logic: unknown }): Promise<AssessmentCondition> {
    const { rows } = await query<AssessmentCondition & any>(
      `INSERT INTO assessment_conditions (organization_id, template_id, name, description, logic) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [organizationId, input.templateId ?? null, input.name ?? null, input.description ?? null, JSON.stringify(input.logic)],
    );
    return mapCondition(rows[0]);
  },
  async listConditions(templateId: string): Promise<AssessmentCondition[]> {
    const { rows } = await query(`SELECT * FROM assessment_conditions WHERE template_id = $1 ORDER BY name`, [templateId]);
    return rows.map(mapCondition);
  },

  async createDependency(input: {
    templateId: string; questionId: string; dependsOnQuestionId: string;
    dependencyType?: string; condition?: unknown;
  }): Promise<AssessmentDependency> {
    const { rows } = await query<AssessmentDependency & any>(
      `INSERT INTO assessment_dependencies (template_id, question_id, depends_on_question_id, dependency_type, condition)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [input.templateId, input.questionId, input.dependsOnQuestionId, input.dependencyType ?? 'requires_answer', JSON.stringify(input.condition ?? null)],
    );
    return mapDependency(rows[0]);
  },
  async listDependencies(templateId: string): Promise<AssessmentDependency[]> {
    const { rows } = await query(`SELECT * FROM assessment_dependencies WHERE template_id = $1`, [templateId]);
    return rows.map(mapDependency);
  },
  async removeDependency(id: string): Promise<void> {
    await query(`DELETE FROM assessment_dependencies WHERE id = $1`, [id]);
  },

  // ---- Scoring & validation rules ----------------------------------------
  async createScoringRule(organizationId: string, input: {
    templateId: string; name: string; method: string; scope?: string; targetId?: string | null;
    config?: Record<string, unknown>; appliesWhen?: unknown; position?: number;
  }) {
    const { rows } = await query(
      `INSERT INTO assessment_scoring_rules (organization_id, template_id, name, method, scope, target_id, config, applies_when, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [organizationId, input.templateId, input.name, input.method, input.scope ?? 'question', input.targetId ?? null, JSON.stringify(input.config ?? {}), JSON.stringify(input.appliesWhen ?? null), input.position ?? 0],
    );
    return rows[0];
  },
  async listScoringRules(templateId: string) {
    const { rows } = await query(`SELECT * FROM assessment_scoring_rules WHERE template_id = $1 ORDER BY position`, [templateId]);
    return rows;
  },
  async createValidationRule(organizationId: string, input: {
    templateId: string; questionId?: string | null; name?: string | null; ruleType: string;
    params?: Record<string, unknown>; message?: string | null; severity?: string; appliesWhen?: unknown;
  }) {
    const { rows } = await query(
      `INSERT INTO assessment_validation_rules (organization_id, template_id, question_id, name, rule_type, params, message, severity, applies_when)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [organizationId, input.templateId, input.questionId ?? null, input.name ?? null, input.ruleType, JSON.stringify(input.params ?? {}), input.message ?? null, input.severity ?? 'error', JSON.stringify(input.appliesWhen ?? null)],
    );
    return rows[0];
  },
  async listValidationRules(templateId: string) {
    const { rows } = await query(`SELECT * FROM assessment_validation_rules WHERE template_id = $1 AND is_active = TRUE`, [templateId]);
    return rows;
  },

  // ---- Framework & control mappings --------------------------------------
  async replaceFrameworkMappings(templateId: string, questionId: string, mappings: FrameworkMappingInput[]): Promise<void> {
    await query(`DELETE FROM assessment_framework_mappings WHERE template_id = $1 AND question_id = $2`, [templateId, questionId]);
    for (const m of mappings) {
      await query(
        `INSERT INTO assessment_framework_mappings
          (organization_id, template_id, question_id, framework, framework_id, requirement_id, control_id, clause_code, mapping_strength, notes)
         SELECT t.organization_id, $2, $3, $4, $5, $6, $7, $8, $9, $10 FROM assessment_templates t WHERE t.id = $1`,
        [templateId, templateId, questionId, m.framework, m.frameworkId ?? null, m.requirementId ?? null, m.controlId ?? null, m.clauseCode ?? null, m.mappingStrength ?? 'direct', m.notes ?? null],
      );
    }
  },
  async listFrameworkMappings(templateId: string) {
    const { rows } = await query(`SELECT * FROM assessment_framework_mappings WHERE template_id = $1 ORDER BY framework`, [templateId]);
    return rows;
  },
  async replaceControlMappings(templateId: string, questionId: string, mappings: ControlMappingInput[]): Promise<void> {
    await query(`DELETE FROM assessment_control_mappings WHERE template_id = $1 AND question_id = $2`, [templateId, questionId]);
    for (const m of mappings) {
      await query(
        `INSERT INTO assessment_control_mappings
          (organization_id, template_id, question_id, control_source, control_id, control_code, control_title, mapping_strength, notes)
         SELECT t.organization_id, $2, $3, $4, $5, $6, $7, $8, $9 FROM assessment_templates t WHERE t.id = $1`,
        [templateId, templateId, questionId, m.controlSource, m.controlId ?? null, m.controlCode ?? null, m.controlTitle ?? null, m.mappingStrength ?? 'direct', m.notes ?? null],
      );
    }
  },
  async listControlMappings(templateId: string) {
    const { rows } = await query(`SELECT * FROM assessment_control_mappings WHERE template_id = $1 ORDER BY control_source`, [templateId]);
    return rows;
  },

  // ---- Versioning ---------------------------------------------------------
  async createVersion(input: { templateId: string; version: number; title: string; description?: string | null; changeSummary?: string | null; snapshot: Record<string, unknown>; createdBy?: string | null }): Promise<AssessmentTemplateVersion> {
    const { rows } = await query<AssessmentTemplateVersion & any>(
      `INSERT INTO assessment_template_versions (template_id, version, title, description, change_summary, snapshot, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.templateId, input.version, input.title, input.description ?? null, input.changeSummary ?? null, JSON.stringify(input.snapshot), input.createdBy ?? null],
    );
    return mapTemplateVersion(rows[0]);
  },

  async listVersions(templateId: string): Promise<AssessmentTemplateVersion[]> {
    const { rows } = await query(`SELECT * FROM assessment_template_versions WHERE template_id = $1 ORDER BY version DESC`, [templateId]);
    return rows.map(mapTemplateVersion);
  },

  async latestVersion(templateId: string): Promise<number> {
    const { rows } = await query<{ v: number }>(`SELECT COALESCE(MAX(version),0) AS v FROM assessment_template_versions WHERE template_id = $1`, [templateId]);
    return rows[0]?.v ?? 0;
  },

  // ---- Duplicate / clone --------------------------------------------------
  async cloneStructure(sourceTemplateId: string, targetTemplateId: string, orgId: string): Promise<void> {
    await withTransaction(async (client) => {
      const sec = await client.query(`SELECT * FROM assessment_sections WHERE template_id = $1 ORDER BY position`, [sourceTemplateId]);
      const sectionMap = new Map<string, string>();
      for (const s of sec.rows) {
        const r = await client.query(
          `INSERT INTO assessment_sections (template_id, parent_section_id, title, description, code, guidance, position, weight, is_required, collapse_by_default, conditional_logic, visibility_rules)
           VALUES ($1,NULL,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [targetTemplateId, s.title, s.description, s.code, s.guidance, s.position, s.weight, s.is_required, s.collapse_by_default, JSON.stringify(s.conditional_logic), JSON.stringify(s.visibility_rules)],
        );
        sectionMap.set(s.id, r.rows[0].id);
      }
      const qs = await client.query(`SELECT * FROM assessment_questions WHERE template_id = $1 ORDER BY position`, [sourceTemplateId]);
      for (const q of qs.rows) {
        const newSec = q.section_id ? (sectionMap.get(q.section_id) ?? null) : null;
        const rq = await client.query(
          `INSERT INTO assessment_questions
            (template_id, section_id, parent_question_id, group_id, code, label, help_text, answer_type_id, answer_type_key,
             position, weight, is_required, allows_multiple, max_selections, scoring_config, validation_rules,
             conditional_logic, visibility_rules, dependency_rules, framework_mappings, control_mappings, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
          [targetTemplateId, newSec, q.parent_question_id, q.group_id, q.code, q.label, q.help_text, q.answer_type_id, q.answer_type_key,
            q.position, q.weight, q.is_required, q.allows_multiple, q.max_selections, JSON.stringify(q.scoring_config),
            JSON.stringify(q.validation_rules), JSON.stringify(q.conditional_logic), JSON.stringify(q.visibility_rules),
            JSON.stringify(q.dependency_rules), JSON.stringify(q.framework_mappings), JSON.stringify(q.control_mappings), JSON.stringify(q.metadata)],
        );
        const opts = await client.query(`SELECT * FROM assessment_question_options WHERE question_id = $1 ORDER BY position`, [q.id]);
        for (const o of opts.rows) {
          await client.query(
            `INSERT INTO assessment_question_options (question_id, label, value, position, score, description, is_default, conditional_logic, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [rq.rows[0].id, o.label, o.value, o.position, o.score, o.description, o.is_default, JSON.stringify(o.conditional_logic), JSON.stringify(o.metadata)],
          );
        }
      }
      const fw = await client.query(`SELECT * FROM assessment_framework_mappings WHERE template_id = $1`, [sourceTemplateId]);
      for (const m of fw.rows) {
        await client.query(
          `INSERT INTO assessment_framework_mappings (organization_id, template_id, question_id, section_id, framework, framework_id, requirement_id, control_id, clause_code, mapping_strength, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          [orgId, targetTemplateId, m.question_id, m.section_id, m.framework, m.framework_id, m.requirement_id, m.control_id, m.clause_code, m.mapping_strength, m.notes],
        );
      }
    });
  },
};

export const conditionRepo = {
  async findByTemplate(templateId: string) {
    return templateRepo.listConditions(templateId);
  },
};
