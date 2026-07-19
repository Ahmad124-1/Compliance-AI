// Assessment service — orchestration layer for the Assessment Framework Engine.
// Owns transactions, invariants, audit logging, and cross-aggregate integration.

import { NotFoundError, BadRequestError } from '../../../core/errors.js';
import { audit } from '../../../core/audit.js';
import { query, withTransaction } from '../../../db/pool.js';
import { templateRepo } from '../repositories/template.repo.js';
import { assessmentRepo } from '../repositories/assessment.repo.js';
import { answerTypeRepo, categoryRepo, tagRepo, assessmentTypeRepo } from '../repositories/catalogue.repo.js';
import { computeQuestionScore, aggregateSection, aggregateOverall } from '../engine/scoring.js';
import { validateResponse, hasBlockingErrors } from '../engine/validation.js';
import type {
  AssessmentTemplate, AssessmentSection, AssessmentQuestion, AssessmentAnswerOption,
  AssessmentCondition, AssessmentDependency, AssessmentTemplateVersion, AssessmentTemplateFilters,
  Paginated, Assessment, AssessmentResponse, AssessmentScore, AssessmentLibraryItem,
  FrameworkMappingInput, ControlMappingInput,
} from '../types.js';

function slugifyTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export const assessmentService = {
  // ======================================================================
  // Catalogue (answer types, categories, tags, types)
  // ======================================================================
  async ensureOrgCatalogue(organizationId: string): Promise<void> {
    await answerTypeRepo.ensureBuiltins(organizationId);
    await assessmentTypeRepo.ensureBuiltins(organizationId);
  },

  listAnswerTypes(organizationId: string) {
    return answerTypeRepo.list(organizationId);
  },
  listCategories(organizationId: string) {
    return categoryRepo.list(organizationId);
  },
  createCategory(organizationId: string, input: { name: string; code?: string | null; description?: string | null; color?: string | null; position?: number }) {
    return categoryRepo.create(organizationId, input);
  },
  updateCategory(organizationId: string, id: string, patch: any) {
    return categoryRepo.update(id, patch);
  },
  removeCategory(organizationId: string, id: string) {
    return categoryRepo.remove(id);
  },
  listTags(organizationId: string) {
    return tagRepo.list(organizationId);
  },
  async touchTags(organizationId: string, names: string[]): Promise<string[]> {
    const out: string[] = [];
    for (const n of names) out.push((await tagRepo.upsert(organizationId, n)).name);
    return out;
  },
  listTypes(organizationId: string) {
    return assessmentTypeRepo.list(organizationId);
  },

  // ======================================================================
  // Templates — CRUD + lifecycle
  // ======================================================================
  async createTemplate(organizationId: string, input: Partial<AssessmentTemplate> & { title: string; type: string }, actorId?: string | null): Promise<AssessmentTemplate> {
    await this.ensureOrgCatalogue(organizationId);
    const tags = input.tags?.length ? await this.touchTags(organizationId, input.tags) : [];
    const tpl = await templateRepo.create(organizationId, {
      ...input,
      code: input.code ?? slugifyTitle(input.title),
      tags,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.create', entity: 'assessment_template', entityId: tpl.id });
    return tpl;
  },

  listTemplates(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<AssessmentTemplate>> {
    return templateRepo.list(organizationId, filters);
  },

  async getTemplate(organizationId: string, id: string): Promise<AssessmentTemplate> {
    const tpl = await templateRepo.findById(id, organizationId);
    if (!tpl) throw new NotFoundError('Assessment template not found');
    return tpl;
  },

  async getTemplateWithStructure(organizationId: string, id: string) {
    const tpl = await this.getTemplate(organizationId, id);
    const sections = await templateRepo.listSections(id);
    const questions = await templateRepo.listQuestions(id);
    const optionsByQ = new Map<string, AssessmentAnswerOption[]>();
    for (const q of questions) {
      optionsByQ.set(q.id, await templateRepo.listOptions(q.id));
    }
    const questionsWithOptions = questions.map((q) => ({ ...q, options: optionsByQ.get(q.id) ?? [] }));
    const sectionMap = new Map<string, AssessmentSection & { questions: AssessmentQuestion[]; children: AssessmentSection[] }>();
    const roots: (AssessmentSection & { questions: AssessmentQuestion[]; children: AssessmentSection[] })[] = [];
    sections.forEach((s) => sectionMap.set(s.id, { ...s, questions: [], children: [] }));
    sections.forEach((s) => {
      const node = sectionMap.get(s.id)!;
      if (s.parentSectionId && sectionMap.has(s.parentSectionId)) sectionMap.get(s.parentSectionId)!.children.push(node);
      else roots.push(node);
    });
    questionsWithOptions.forEach((q) => {
      if (q.sectionId && sectionMap.has(q.sectionId)) sectionMap.get(q.sectionId)!.questions.push(q);
      else roots.push({ ...(sectionMap.get(q.sectionId ?? '') ?? {}), id: q.sectionId ?? '_', title: 'Ungrouped', questions: [q], children: [] } as any);
    });
    return { template: tpl, sections: roots, questions: questionsWithOptions };
  },

  async updateTemplate(organizationId: string, id: string, patch: Partial<AssessmentTemplate>, actorId?: string | null): Promise<AssessmentTemplate> {
    const existing = await this.getTemplate(organizationId, id);
    const next = { ...patch };
    if (next.tags?.length) next.tags = await this.touchTags(organizationId, next.tags);
    const updated = await templateRepo.update(id, organizationId, { ...next, updatedBy: actorId });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.update', entity: 'assessment_template', entityId: id });
    return updated ?? existing;
  },

  async archiveTemplate(organizationId: string, id: string, actorId?: string | null): Promise<AssessmentTemplate> {
    const tpl = await this.getTemplate(organizationId, id);
    if (tpl.isArchived) throw new BadRequestError('Template already archived');
    const updated = await templateRepo.archive(id, organizationId, actorId);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.archive', entity: 'assessment_template', entityId: id });
    return updated!;
  },

  async restoreTemplate(organizationId: string, id: string, actorId?: string | null): Promise<AssessmentTemplate> {
    const updated = await templateRepo.restore(id, organizationId);
    if (!updated) throw new NotFoundError('Assessment template not found');
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.restore', entity: 'assessment_template', entityId: id });
    return updated;
  },

  async deleteTemplate(organizationId: string, id: string): Promise<void> {
    await this.getTemplate(organizationId, id);
    await templateRepo.remove(id, organizationId);
    await audit({ organizationId, action: 'assessment_template.delete', entity: 'assessment_template', entityId: id });
  },

  async publishTemplate(organizationId: string, id: string, actorId?: string | null, changeSummary?: string): Promise<AssessmentTemplate> {
    const tpl = await this.getTemplate(organizationId, id);
    const sections = await templateRepo.listSections(id);
    const questions = await templateRepo.listQuestions(id);
    if (questions.length === 0) throw new BadRequestError('Cannot publish a template without questions');
    const snapshot = {
      template: { ...tpl, sections, questions },
      publishedAt: new Date().toISOString(),
      changeSummary: changeSummary ?? 'Published',
    };
    await templateRepo.createVersion({ templateId: id, version: tpl.version, title: tpl.title, description: tpl.description, changeSummary: changeSummary ?? 'Published', snapshot, createdBy: actorId });
    const updated = await templateRepo.update(id, organizationId, { status: 'published', isPublished: true, updatedBy: actorId });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.publish', entity: 'assessment_template', entityId: id });
    return updated!;
  },

  async unpublishTemplate(organizationId: string, id: string, actorId?: string | null): Promise<AssessmentTemplate> {
    const updated = await templateRepo.update(id, organizationId, { status: 'draft', isPublished: false, updatedBy: actorId });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.unpublish', entity: 'assessment_template', entityId: id });
    return updated!;
  },

  async duplicateTemplate(organizationId: string, id: string, actorId?: string | null): Promise<AssessmentTemplate> {
    const source = await this.getTemplate(organizationId, id);
    const copy = await templateRepo.create(organizationId, {
      code: `${slugifyTitle(source.title)}-copy`,
      title: `${source.title} (copy)`,
      description: source.description,
      type: source.type,
      categoryId: source.categoryId,
      defaultLanguage: source.defaultLanguage,
      estimatedDurationMinutes: source.estimatedDurationMinutes,
      instructions: source.instructions,
      scoringConfig: source.scoringConfig,
      settings: source.settings,
      tags: source.tags,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await templateRepo.cloneStructure(id, copy.id, organizationId);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.duplicate', entity: 'assessment_template', entityId: copy.id, metadata: { sourceId: id } });
    return copy;
  },

  async cloneTemplate(organizationId: string, id: string, targetOrgId: string, actorId?: string | null): Promise<AssessmentTemplate> {
    const source = await this.getTemplate(organizationId, id);
    await this.ensureOrgCatalogue(targetOrgId);
    const copy = await templateRepo.create(targetOrgId, {
      code: source.code, title: source.title, description: source.description, type: source.type,
      categoryId: source.categoryId, defaultLanguage: source.defaultLanguage,
      estimatedDurationMinutes: source.estimatedDurationMinutes, instructions: source.instructions,
      scoringConfig: source.scoringConfig, settings: source.settings, tags: source.tags,
      createdBy: actorId, updatedBy: actorId, parentTemplateId: id,
    });
    await templateRepo.cloneStructure(id, copy.id, targetOrgId);
    await audit({ organizationId: targetOrgId, actorId: actorId ?? null, action: 'assessment_template.clone', entity: 'assessment_template', entityId: copy.id, metadata: { sourceId: id } });
    return copy;
  },

  async createVersionDraft(organizationId: string, id: string, actorId?: string | null, changeSummary?: string): Promise<AssessmentTemplate> {
    const tpl = await this.getTemplate(organizationId, id);
    const newVersion = tpl.version + 1;
    const sections = await templateRepo.listSections(id);
    const questions = await templateRepo.listQuestions(id);
    const snapshot = { template: { ...tpl, sections, questions }, changeSummary: changeSummary ?? 'New version draft' };
    await templateRepo.createVersion({ templateId: id, version: newVersion, title: tpl.title, description: tpl.description, changeSummary: changeSummary ?? `Version ${newVersion}`, snapshot, createdBy: actorId });
    const updated = await templateRepo.update(id, organizationId, { version: newVersion, updatedBy: actorId });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_template.version', entity: 'assessment_template', entityId: id, metadata: { version: newVersion } });
    return updated!;
  },

  listVersions(organizationId: string, id: string): Promise<AssessmentTemplateVersion[]> {
    return templateRepo.listVersions(id);
  },

  async getVersion(organizationId: string, id: string, version: number): Promise<AssessmentTemplateVersion> {
    const versions = await templateRepo.listVersions(id);
    const v = versions.find((x) => x.version === version);
    if (!v) throw new NotFoundError('Template version not found');
    return v;
  },

  // ======================================================================
  // Checklist builder — sections, questions, options
  // ======================================================================
  async createSection(organizationId: string, templateId: string, input: Partial<AssessmentSection> & { title: string; position: number }, actorId?: string | null): Promise<AssessmentSection> {
    await this.getTemplate(organizationId, templateId);
    const section = await templateRepo.createSection(templateId, input);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_section.create', entity: 'assessment_section', entityId: section.id });
    return section;
  },
  async updateSection(organizationId: string, templateId: string, sectionId: string, patch: Partial<AssessmentSection>, actorId?: string | null): Promise<AssessmentSection> {
    await this.getTemplate(organizationId, templateId);
    const updated = await templateRepo.updateSection(sectionId, patch);
    if (!updated) throw new NotFoundError('Section not found');
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_section.update', entity: 'assessment_section', entityId: sectionId });
    return updated;
  },
  async deleteSection(organizationId: string, templateId: string, sectionId: string, actorId?: string | null): Promise<void> {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.removeSection(sectionId);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_section.delete', entity: 'assessment_section', entityId: sectionId });
  },
  async reorderSections(organizationId: string, templateId: string, orderedIds: string[], actorId?: string | null): Promise<void> {
    await this.getTemplate(organizationId, templateId);
    await withTransaction(async (client) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(`UPDATE assessment_sections SET position = $1 WHERE id = $2 AND template_id = $3`, [i, orderedIds[i], templateId]);
      }
    });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_section.reorder', entity: 'assessment_template', entityId: templateId });
  },

  async createQuestion(organizationId: string, templateId: string, input: Partial<AssessmentQuestion> & { label: string; answerTypeKey: string; position: number }, actorId?: string | null): Promise<AssessmentQuestion> {
    await this.getTemplate(organizationId, templateId);
    const question = await templateRepo.createQuestion(templateId, input);
    if (input.options && input.options.length) {
      await templateRepo.replaceOptions(question.id, input.options);
    }
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_question.create', entity: 'assessment_question', entityId: question.id });
    return question;
  },
  async updateQuestion(organizationId: string, templateId: string, questionId: string, patch: Partial<AssessmentQuestion>, actorId?: string | null): Promise<AssessmentQuestion> {
    await this.getTemplate(organizationId, templateId);
    const updated = await templateRepo.updateQuestion(questionId, patch);
    if (!updated) throw new NotFoundError('Question not found');
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_question.update', entity: 'assessment_question', entityId: questionId });
    return updated;
  },
  async deleteQuestion(organizationId: string, templateId: string, questionId: string, actorId?: string | null): Promise<void> {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.removeQuestion(questionId);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_question.delete', entity: 'assessment_question', entityId: questionId });
  },
  async reorderQuestions(organizationId: string, templateId: string, orderedIds: string[], actorId?: string | null): Promise<void> {
    await this.getTemplate(organizationId, templateId);
    await withTransaction(async (client) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(`UPDATE assessment_questions SET position = $1 WHERE id = $2 AND template_id = $3`, [i, orderedIds[i], templateId]);
      }
    });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_question.reorder', entity: 'assessment_template', entityId: templateId });
  },
  async setQuestionOptions(organizationId: string, templateId: string, questionId: string, options: { label: string; value: string; position: number; score?: number; description?: string | null; isDefault?: boolean }[], actorId?: string | null): Promise<AssessmentAnswerOption[]> {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.replaceOptions(questionId, options);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_question.options', entity: 'assessment_question', entityId: questionId });
    return templateRepo.listOptions(questionId);
  },

  // ======================================================================
  // Conditional logic & dependencies
  // ======================================================================
  async createCondition(organizationId: string, input: { templateId?: string | null; name?: string | null; description?: string | null; logic: unknown }, actorId?: string | null): Promise<AssessmentCondition> {
    if (input.templateId) await this.getTemplate(organizationId, input.templateId);
    const c = await templateRepo.createCondition(organizationId, input);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_condition.create', entity: 'assessment_condition', entityId: c.id });
    return c;
  },
  listConditions(organizationId: string, templateId: string): Promise<AssessmentCondition[]> {
    return templateRepo.listConditions(templateId);
  },
  async createDependency(organizationId: string, templateId: string, input: { questionId: string; dependsOnQuestionId: string; dependencyType?: string; condition?: unknown }, actorId?: string | null): Promise<AssessmentDependency> {
    await this.getTemplate(organizationId, templateId);
    const d = await templateRepo.createDependency({ templateId, ...input });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_dependency.create', entity: 'assessment_dependency', entityId: d.id });
    return d;
  },
  listDependencies(organizationId: string, templateId: string): Promise<AssessmentDependency[]> {
    return templateRepo.listDependencies(templateId);
  },
  async deleteDependency(organizationId: string, templateId: string, id: string, actorId?: string | null): Promise<void> {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.removeDependency(id);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_dependency.delete', entity: 'assessment_dependency', entityId: id });
  },

  // ======================================================================
  // Scoring & validation rules
  // ======================================================================
  async createScoringRule(organizationId: string, input: any, actorId?: string | null) {
    const r = await templateRepo.createScoringRule(organizationId, input);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_scoring_rule.create', entity: 'assessment_scoring_rule', entityId: r.id });
    return r;
  },
  listScoringRules(organizationId: string, templateId: string) {
    return templateRepo.listScoringRules(templateId);
  },
  async createValidationRule(organizationId: string, input: any, actorId?: string | null) {
    const r = await templateRepo.createValidationRule(organizationId, input);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_validation_rule.create', entity: 'assessment_validation_rule', entityId: r.id });
    return r;
  },
  listValidationRules(organizationId: string, templateId: string) {
    return templateRepo.listValidationRules(templateId);
  },

  // ======================================================================
  // Framework & control mappings
  // ======================================================================
  async setFrameworkMappings(organizationId: string, templateId: string, questionId: string, mappings: FrameworkMappingInput[], actorId?: string | null) {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.replaceFrameworkMappings(templateId, questionId, mappings);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_framework_mapping.set', entity: 'assessment_question', entityId: questionId });
    return templateRepo.listFrameworkMappings(templateId);
  },
  listFrameworkMappings(organizationId: string, templateId: string) {
    return templateRepo.listFrameworkMappings(templateId);
  },
  async setControlMappings(organizationId: string, templateId: string, questionId: string, mappings: ControlMappingInput[], actorId?: string | null) {
    await this.getTemplate(organizationId, templateId);
    await templateRepo.replaceControlMappings(templateId, questionId, mappings);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment_control_mapping.set', entity: 'assessment_question', entityId: questionId });
    return templateRepo.listControlMappings(templateId);
  },
  listControlMappings(organizationId: string, templateId: string) {
    return templateRepo.listControlMappings(templateId);
  },

  // ======================================================================
  // Library
  // ======================================================================
  library(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<AssessmentLibraryItem>> {
    return assessmentRepo.library(organizationId, filters);
  },

  dashboard(organizationId: string) {
    return assessmentRepo.dashboard(organizationId);
  },

  // ======================================================================
  // Runtime — assessments
  // ======================================================================
  async createAssessment(organizationId: string, input: Partial<Assessment> & { templateId: string; title: string; type: string }, actorId?: string | null): Promise<Assessment> {
    const tpl = await this.getTemplate(organizationId, input.templateId);
    const assessment = await assessmentRepo.create(organizationId, {
      ...input,
      templateVersion: tpl.version,
      createdBy: actorId,
    });
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment.create', entity: 'assessment', entityId: assessment.id });
    return assessment;
  },

  listAssessments(organizationId: string, filters: AssessmentTemplateFilters = {}): Promise<Paginated<Assessment>> {
    return assessmentRepo.list(organizationId, filters);
  },

  async getAssessment(organizationId: string, id: string): Promise<Assessment> {
    const a = await assessmentRepo.findById(id, organizationId);
    if (!a) throw new NotFoundError('Assessment not found');
    return a;
  },

  async updateAssessment(organizationId: string, id: string, patch: Partial<Assessment>, actorId?: string | null): Promise<Assessment> {
    const updated = await assessmentRepo.update(id, organizationId, patch);
    if (!updated) throw new NotFoundError('Assessment not found');
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment.update', entity: 'assessment', entityId: id });
    return updated;
  },

  async deleteAssessment(organizationId: string, id: string, actorId?: string | null): Promise<void> {
    await this.getAssessment(organizationId, id);
    await assessmentRepo.remove(id, organizationId);
    await audit({ organizationId, actorId: actorId ?? null, action: 'assessment.delete', entity: 'assessment', entityId: id });
  },

  // ======================================================================
  // Runtime — responses, scoring, validation
  // ======================================================================
  async submitResponse(organizationId: string, assessmentId: string, questionId: string, payload: any, actorId?: string | null): Promise<{ response: AssessmentResponse; score?: AssessmentScore; issues: ReturnType<typeof validateResponse> }> {
    const assessment = await this.getAssessment(organizationId, assessmentId);
    const question = await templateRepo.findQuestion(questionId);
    if (!question || question.templateId !== assessment.templateId) throw new NotFoundError('Question does not belong to this assessment template');

    const value = payload.answerNumber !== undefined && payload.answerNumber !== null
      ? payload.answerNumber
      : payload.selectedValues ?? payload.selectedOptionIds ?? payload.answerJson ?? payload.answerText ?? null;

    const rules = await templateRepo.listValidationRules(assessment.templateId);
    const questionRules = rules.filter((r) => r.question_id === questionId);
    const allResponses = await assessmentRepo.listResponses(assessmentId);
    const answerMap: Record<string, unknown> = {};
    allResponses.forEach((r) => { answerMap[r.questionId] = r.answerNumber ?? r.answerJson ?? r.selectedValues ?? r.answerText; });
    answerMap[questionId] = value;
    const issues = validateResponse(value, questionRules.map((r) => this.toValidationRule(r)), answerMap);

    const response = await assessmentRepo.upsertResponse({
      assessmentId, questionId, sectionId: question.sectionId, respondentId: actorId,
      answerText: payload.answerText ?? null, answerNumber: payload.answerNumber ?? null, answerJson: payload.answerJson ?? {},
      selectedOptionIds: payload.selectedOptionIds ?? null, selectedValues: payload.selectedValues ?? null,
      isSkipped: payload.isSkipped ?? false, isFlagged: payload.isFlagged ?? false, confidence: payload.confidence ?? null,
      validationStatus: hasBlockingErrors(issues) ? 'invalid' : issues.length ? 'invalid' : 'valid',
      validationMessages: issues.map((i) => i.message),
    });

    let score: AssessmentScore | undefined;
    if (!hasBlockingErrors(issues) && !response.isSkipped) {
      const fullQuestion: AssessmentQuestion = { ...question, options: await templateRepo.listOptions(questionId) };
      const result = computeQuestionScore(fullQuestion, value, { ...(question.scoringConfig as any), weight: question.weight });
      score = await assessmentRepo.upsertScore({
        assessmentId, questionId, sectionId: question.sectionId, method: result.method,
        rawValue: result.rawValue, normalizedScore: result.normalizedScore, weightedScore: result.weightedScore,
        maxScore: result.maxScore, label: result.label, passed: result.passed, details: result.details,
      });
      await this.recomputeAssessmentScores(organizationId, assessmentId);
    }

    return { response, score, issues };
  },

  toValidationRule(r: any) {
    return {
      id: r.id, questionId: r.question_id, ruleType: r.rule_type, params: r.params ?? {}, message: r.message,
      severity: r.severity ?? 'error', isActive: r.is_active ?? true, appliesWhen: r.applies_when,
    };
  },

  async recomputeAssessmentScores(organizationId: string, assessmentId: string): Promise<void> {
    const assessment = await this.getAssessment(organizationId, assessmentId);
    const questions = await templateRepo.listQuestions(assessment.templateId);
    const sections = await templateRepo.listSections(assessment.templateId);
    const scores = await assessmentRepo.listScores(assessmentId);
    const scoreByQ = new Map<string, any>();
    scores.forEach((s) => { if (s.questionId) scoreByQ.set(s.questionId, s); });

    const sectionAgg: ReturnType<typeof aggregateSection>[] = [];
    for (const sec of sections) {
      const qScores = scores.filter((s) => s.sectionId === sec.id && s.questionId);
      if (qScores.length) {
        const agg = aggregateSection(sec.id, qScores.map((s) => ({ method: s.method, rawValue: s.rawValue, normalizedScore: s.normalizedScore ?? 0, weightedScore: s.weightedScore ?? 0, maxScore: s.maxScore ?? 100, label: s.label, passed: s.passed, details: s.details })));
        sectionAgg.push(agg);
        await assessmentRepo.upsertScore({ assessmentId, sectionId: sec.id, method: 'weighted', normalizedScore: agg.normalizedScore, weightedScore: agg.weightedScore, maxScore: agg.maxWeighted, label: `${Math.round(agg.normalizedScore)}%` });
      }
    }
    const overall = aggregateOverall(sectionAgg.length ? sectionAgg : scores.filter((s) => s.questionId).map((s) => aggregateSection(s.questionId ?? 'x', [s as any])));

    const answered = scores.filter((s) => s.questionId).length;
    const progress = questions.length ? Math.round((answered / questions.length) * 100) : 0;
    await assessmentRepo.update(assessmentId, organizationId, {
      progress,
      scoringSummary: {
        overallScore: Math.round(overall.normalizedScore),
        questionCount: overall.questionCount,
        passedCount: overall.passedCount,
        failedCount: overall.failedCount,
        bySection: overall.bySection,
      },
    });
  },

  listResponses(organizationId: string, assessmentId: string): Promise<AssessmentResponse[]> {
    return assessmentRepo.listResponses(assessmentId);
  },
  listScores(organizationId: string, assessmentId: string): Promise<AssessmentScore[]> {
    return assessmentRepo.listScores(assessmentId);
  },

  // ======================================================================
  // Workflow — assignments, reviews, approvals, comments, attachments
  // ======================================================================
  createAssignment(organizationId: string, assessmentId: string, input: any, actorId?: string | null) {
    return assessmentRepo.createAssignment({ organizationId, assessmentId, ...input, assignedBy: actorId });
  },
  listAssignments(organizationId: string, assessmentId: string) {
    return assessmentRepo.listAssignments(assessmentId);
  },
  updateAssignment(organizationId: string, assessmentId: string, id: string, patch: any) {
    return assessmentRepo.updateAssignment(id, patch);
  },
  createReview(organizationId: string, assessmentId: string, input: any, actorId?: string | null) {
    return assessmentRepo.createReview({ organizationId, assessmentId, ...input, reviewerId: actorId });
  },
  listReviews(organizationId: string, assessmentId: string) {
    return assessmentRepo.listReviews(assessmentId);
  },
  updateReview(organizationId: string, assessmentId: string, id: string, patch: any) {
    return assessmentRepo.updateReview(id, patch);
  },
  createApproval(organizationId: string, assessmentId: string, input: any, actorId?: string | null) {
    return assessmentRepo.createApproval({ organizationId, assessmentId, ...input, approverId: actorId });
  },
  listApprovals(organizationId: string, assessmentId: string) {
    return assessmentRepo.listApprovals(assessmentId);
  },
  updateApproval(organizationId: string, assessmentId: string, id: string, patch: any) {
    return assessmentRepo.updateApproval(id, patch);
  },
  createComment(organizationId: string, assessmentId: string, input: any, actorId?: string | null) {
    return assessmentRepo.createComment({ organizationId, assessmentId, ...input, authorId: actorId });
  },
  listComments(organizationId: string, assessmentId: string) {
    return assessmentRepo.listComments(assessmentId);
  },
  resolveComment(organizationId: string, assessmentId: string, id: string, resolved: boolean) {
    return assessmentRepo.resolveComment(id, resolved);
  },
  createAttachment(organizationId: string, assessmentId: string, input: any, actorId?: string | null) {
    return assessmentRepo.createAttachment({ organizationId, assessmentId, ...input, uploadedBy: actorId });
  },
  listAttachments(organizationId: string, assessmentId: string) {
    return assessmentRepo.listAttachments(assessmentId);
  },

  // ======================================================================
  // Schedule placeholders
  // ======================================================================
  createSchedulePlaceholder(organizationId: string, input: any) {
    return assessmentRepo.createSchedulePlaceholder({ organizationId, ...input });
  },
  listSchedulePlaceholders(organizationId: string) {
    return assessmentRepo.listSchedulePlaceholders(organizationId);
  },

  // ======================================================================
  // Enterprise search within assessments (templates + instances)
  // ======================================================================
  async searchWithin(organizationId: string, term: string) {
    const t = `%${term}%`;
    const templates = await query<any>(
      `SELECT id, title, code, type, version, status FROM assessment_templates
       WHERE organization_id = $1 AND is_archived = FALSE AND (title ILIKE $2 OR code ILIKE $2 OR description ILIKE $2) ORDER BY title LIMIT 25`,
      [organizationId, t],
    );
    const assessments = await query<any>(
      `SELECT a.id, a.title, a.code, a.type, a.status FROM assessments a
       WHERE a.organization_id = $1 AND (a.title ILIKE $2 OR a.code ILIKE $2) ORDER BY a.updated_at DESC LIMIT 25`,
      [organizationId, t],
    );
    return { templates: templates.rows, assessments: assessments.rows };
  },
};
