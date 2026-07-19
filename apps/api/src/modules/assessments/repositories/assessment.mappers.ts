// Assessment repositories — data access for the Assessment Framework Engine.
// One cohesive repository module (mirrors the flat style used by analytics.repo).

import type {
  Assessment,
  AssessmentAnswerType,
  AssessmentAssignment,
  AssessmentAttachment,
  AssessmentCategory,
  AssessmentComment,
  AssessmentCondition,
  AssessmentControlMapping,
  AssessmentDependency,
  AssessmentFrameworkMapping,
  AssessmentQuestion,
  AssessmentResponse,
  AssessmentScore,
  AssessmentSchedulePlaceholder,
  AssessmentSection,
  AssessmentTag,
  AssessmentTemplate,
  AssessmentTemplateVersion,
  AssessmentTypeCatalogue,
  AssessmentValidationRule,
  AssessmentAnswerOption,
} from '../types.js';

// --------------------------------------------------------------------------
// Mappers
// --------------------------------------------------------------------------

function mapAnswerType(r: any): AssessmentAnswerType {
  return {
    id: r.id, organizationId: r.organization_id, key: r.key, label: r.label,
    description: r.description, hasOptions: r.has_options, supportsValidation: r.supports_validation,
    isBuiltin: r.is_builtin, isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapCategory(r: any): AssessmentCategory {
  return {
    id: r.id, organizationId: r.organization_id, name: r.name, code: r.code, description: r.description,
    color: r.color, position: r.position, isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTag(r: any): AssessmentTag {
  return { id: r.id, organizationId: r.organization_id, name: r.name, slug: r.slug, color: r.color, createdAt: r.created_at };
}

function mapType(r: any): AssessmentTypeCatalogue {
  return {
    id: r.id, organizationId: r.organization_id, type: r.type, label: r.label, description: r.description,
    defaultScoringMethod: r.default_scoring_method, isSystem: r.is_system, isActive: r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapOption(r: any): AssessmentAnswerOption {
  return {
    id: r.id, questionId: r.question_id, label: r.label, value: r.value, position: r.position,
    score: Number(r.score ?? 0), description: r.description, isDefault: r.is_default,
    conditionalLogic: r.conditional_logic, metadata: r.metadata ?? {},
  };
}

function mapQuestion(r: any): AssessmentQuestion {
  return {
    id: r.id, templateId: r.template_id, sectionId: r.section_id, parentQuestionId: r.parent_question_id,
    groupId: r.group_id, code: r.code, label: r.label, helpText: r.help_text, answerTypeId: r.answer_type_id,
    answerTypeKey: r.answer_type_key, position: r.position, weight: Number(r.weight ?? 1), isRequired: r.is_required,
    allowsMultiple: r.allows_multiple, maxSelections: r.max_selections, scoringConfig: r.scoring_config ?? {},
    validationRules: r.validation_rules ?? {}, conditionalLogic: r.conditional_logic, visibilityRules: r.visibility_rules,
    dependencyRules: r.dependency_rules, frameworkMappings: r.framework_mappings ?? [], controlMappings: r.control_mappings ?? [],
    metadata: r.metadata ?? {}, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapSection(r: any): AssessmentSection {
  return {
    id: r.id, templateId: r.template_id, parentSectionId: r.parent_section_id, title: r.title, description: r.description,
    code: r.code, guidance: r.guidance, position: r.position, weight: Number(r.weight ?? 1), isRequired: r.is_required,
    collapseByDefault: r.collapse_by_default, conditionalLogic: r.conditional_logic, visibilityRules: r.visibility_rules,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTemplate(r: any): AssessmentTemplate {
  return {
    id: r.id, organizationId: r.organization_id, code: r.code, title: r.title, description: r.description,
    type: r.type, categoryId: r.category_id, version: r.version, status: r.status, isPublished: r.is_published,
    isArchived: r.is_archived, archivedAt: r.archived_at, archivedBy: r.archived_by, parentTemplateId: r.parent_template_id,
    latestVersionId: r.latest_version_id, defaultLanguage: r.default_language,
    estimatedDurationMinutes: r.estimated_duration_minutes, instructions: r.instructions,
    scoringConfig: r.scoring_config ?? {}, settings: r.settings ?? {}, tags: r.tags ?? [], createdBy: r.created_by,
    updatedBy: r.updated_by, createdAt: r.created_at, updatedAt: r.updated_at,
    category: r.category_name ? { id: r.category_id, organizationId: r.organization_id, name: r.category_name, code: r.category_code, description: null, color: r.category_color, position: 0, isActive: true, createdAt: r.created_at, updatedAt: r.updated_at } : null,
  };
}

function mapCondition(r: any): AssessmentCondition {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, name: r.name, description: r.description,
    logic: r.logic, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapDependency(r: any): AssessmentDependency {
  return {
    id: r.id, templateId: r.template_id, questionId: r.question_id, dependsOnQuestionId: r.depends_on_question_id,
    dependencyType: r.dependency_type, condition: r.condition, createdAt: r.created_at,
  };
}

function mapScoringRule(r: any) {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, name: r.name, method: r.method,
    scope: r.scope, targetId: r.target_id, config: r.config ?? {}, appliesWhen: r.applies_when, position: r.position,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapValidationRule(r: any): AssessmentValidationRule {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, questionId: r.question_id, name: r.name,
    ruleType: r.rule_type, params: r.params ?? {}, message: r.message, severity: r.severity, appliesWhen: r.applies_when,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapFrameworkMapping(r: any): AssessmentFrameworkMapping {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, questionId: r.question_id,
    sectionId: r.section_id, framework: r.framework, frameworkId: r.framework_id, requirementId: r.requirement_id,
    controlId: r.control_id, clauseCode: r.clause_code, mappingStrength: r.mapping_strength, notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapControlMapping(r: any): AssessmentControlMapping {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, questionId: r.question_id,
    sectionId: r.section_id, controlSource: r.control_source, controlId: r.control_id, controlCode: r.control_code,
    controlTitle: r.control_title, mappingStrength: r.mapping_strength, notes: r.notes, createdAt: r.created_at,
  };
}

function mapAssessment(r: any): Assessment {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, templateVersion: r.template_version,
    code: r.code, title: r.title, type: r.type, categoryId: r.category_id, status: r.status, scope: r.scope,
    siteId: r.site_id, departmentId: r.department_id, teamId: r.team_id, assigneeId: r.assignee_id, createdBy: r.created_by,
    scheduledStartDate: r.scheduled_start_date, scheduledEndDate: r.scheduled_end_date, startedAt: r.started_at,
    submittedAt: r.submitted_at, completedAt: r.completed_at, dueDate: r.due_date, progress: Number(r.progress ?? 0),
    scoringSummary: r.scoring_summary ?? {}, tags: r.tags ?? [], metadata: r.metadata ?? {}, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapScore(r: any): AssessmentScore {
  return {
    id: r.id, assessmentId: r.assessment_id, questionId: r.question_id, sectionId: r.section_id, method: r.method,
    rawValue: r.raw_value, normalizedScore: r.normalized_score, weightedScore: r.weighted_score, maxScore: r.max_score,
    label: r.label, passed: r.passed, details: r.details ?? {}, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapResponse(r: any): AssessmentResponse {
  return {
    id: r.id, assessmentId: r.assessment_id, questionId: r.question_id, sectionId: r.section_id,
    respondentId: r.respondent_id, answerText: r.answer_text, answerNumber: r.answer_number, answerJson: r.answer_json ?? {},
    selectedOptionIds: r.selected_option_ids, selectedValues: r.selected_values, isSkipped: r.is_skipped, isFlagged: r.is_flagged,
    confidence: r.confidence, validationStatus: r.validation_status, validationMessages: r.validation_messages ?? [],
    answeredAt: r.answered_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAssignment(r: any): AssessmentAssignment {
  return {
    id: r.id, organizationId: r.organization_id, assessmentId: r.assessment_id, assigneeId: r.assignee_id,
    assigneeRole: r.assignee_role, assignedBy: r.assigned_by, status: r.status, scope: r.scope, targetId: r.target_id,
    dueDate: r.due_date, instructions: r.instructions, acceptedAt: r.accepted_at, completedAt: r.completed_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapReview(r: any) {
  return {
    id: r.id, organizationId: r.organization_id, assessmentId: r.assessment_id, reviewerId: r.reviewer_id,
    decision: r.decision, scope: r.scope, targetId: r.target_id, summary: r.summary, scoreOverride: r.score_override,
    reviewedAt: r.reviewed_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapApproval(r: any) {
  return {
    id: r.id, organizationId: r.organization_id, assessmentId: r.assessment_id, approverId: r.approver_id,
    level: r.level, decision: r.decision, notes: r.notes, approvedAt: r.approved_at, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapComment(r: any): AssessmentComment {
  return {
    id: r.id, organizationId: r.organization_id, assessmentId: r.assessment_id, authorId: r.author_id, kind: r.kind,
    scope: r.scope, targetId: r.target_id, body: r.body, isResolved: r.is_resolved, parentCommentId: r.parent_comment_id,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapAttachment(r: any): AssessmentAttachment {
  return {
    id: r.id, organizationId: r.organization_id, assessmentId: r.assessment_id, assessmentResponseId: r.assessment_response_id,
    uploadedBy: r.uploaded_by, fileName: r.file_name, fileType: r.file_type, fileSize: r.file_size, storageKey: r.storage_key,
    url: r.url, kind: r.kind, createdAt: r.created_at,
  };
}

function mapSchedulePlaceholder(r: any): AssessmentSchedulePlaceholder {
  return {
    id: r.id, organizationId: r.organization_id, templateId: r.template_id, name: r.name, frequency: r.frequency,
    intervalCount: r.interval_count, anchorDay: r.anchor_day, anchorMonth: r.anchor_month, scope: r.scope,
    siteId: r.site_id, departmentId: r.department_id, defaultAssigneeId: r.default_assignee_id, description: r.description,
    isActive: r.is_active, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapTemplateVersion(r: any): AssessmentTemplateVersion {
  return {
    id: r.id, templateId: r.template_id, version: r.version, title: r.title, description: r.description,
    changeSummary: r.change_summary, snapshot: r.snapshot ?? {}, createdBy: r.created_by, createdAt: r.created_at,
  };
}

export {
  mapTemplate, mapQuestion, mapSection, mapOption, mapAnswerType, mapCategory, mapTag, mapType,
  mapCondition, mapDependency, mapTemplateVersion, mapAssessment, mapScore, mapResponse, mapAssignment,
  mapReview, mapApproval, mapComment, mapAttachment, mapSchedulePlaceholder,
  mapScoringRule, mapValidationRule, mapFrameworkMapping, mapControlMapping,
};
