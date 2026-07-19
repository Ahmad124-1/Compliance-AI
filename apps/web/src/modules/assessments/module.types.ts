// Assessment Framework Engine — web domain types (mirror API responses).

export type AssessmentTypeKey =
  | 'internal' | 'supplier' | 'factory' | 'self' | 'customer' | 'pre_audit' | 'follow_up' | 'custom';

export type AssessmentStatusKey =
  | 'draft' | 'in_progress' | 'submitted' | 'under_review' | 'approved'
  | 'rejected' | 'completed' | 'cancelled' | 'archived';

export type TemplateStatus = 'draft' | 'published' | 'archived';

export type AnswerTypeKey =
  | 'short_text' | 'long_text' | 'number' | 'currency' | 'percentage'
  | 'date' | 'time' | 'datetime' | 'dropdown' | 'multiselect' | 'checkbox'
  | 'radio' | 'yes_no' | 'pass_fail' | 'file' | 'image' | 'video' | 'audio'
  | 'signature' | 'rating' | 'risk_matrix' | 'table' | 'location';

export type ScoringMethod =
  | 'pass_fail' | 'percentage' | 'weighted' | 'risk' | 'compliance' | 'manual' | 'automatic';

export type FrameworkKey =
  | 'SMETA' | 'SA8000' | 'ISO_9001' | 'ISO_14001' | 'ISO_45001' | 'GRI' | 'BSCI' | 'amfori'
  | 'customer_code' | 'internal_standard' | 'existing_control';

export type ValidationRuleType = 'required' | 'range' | 'pattern' | 'file' | 'answer' | 'custom' | 'conditional';

export type ConditionCombinator = 'AND' | 'OR';
export type ConditionOperator =
  | 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'is_empty' | 'is_not_empty' | 'answered' | 'not_answered';

export interface ConditionLeaf { kind: 'leaf'; questionId: string; operator: ConditionOperator; value?: unknown }
export interface ConditionGroup { kind: 'group'; combinator: ConditionCombinator; children: ConditionNode[] }
export type ConditionNode = ConditionLeaf | ConditionGroup;
export type ConditionTree = ConditionNode | null;

export interface AssessmentAnswerType { id: string; organizationId: string; key: AnswerTypeKey; label: string; description: string | null; hasOptions: boolean; supportsValidation: boolean; isBuiltin: boolean; isActive: boolean; createdAt: string; updatedAt: string }
export interface AssessmentCategory { id: string; organizationId: string; name: string; code: string | null; description: string | null; color: string | null; position: number; isActive: boolean; createdAt: string; updatedAt: string }
export interface AssessmentTag { id: string; organizationId: string; name: string; slug: string; color: string | null; createdAt: string }
export interface AssessmentTypeCatalogue { id: string; organizationId: string; type: AssessmentTypeKey; label: string; description: string | null; defaultScoringMethod: ScoringMethod | null; isSystem: boolean; isActive: boolean; createdAt: string; updatedAt: string }

export interface AssessmentAnswerOption { id: string; questionId: string; label: string; value: string; position: number; score: number; description: string | null; isDefault: boolean; conditionalLogic: ConditionTree; metadata: Record<string, unknown> }

export interface AssessmentQuestion {
  id: string; templateId: string; sectionId: string | null; parentQuestionId: string | null; groupId: string | null;
  code: string | null; label: string; helpText: string | null; answerTypeId: string | null; answerTypeKey: AnswerTypeKey;
  position: number; weight: number; isRequired: boolean; allowsMultiple: boolean; maxSelections: number | null;
  scoringConfig: Record<string, unknown>; validationRules: Record<string, unknown>; conditionalLogic: ConditionTree;
  visibilityRules: ConditionTree; dependencyRules: ConditionTree; frameworkMappings: FrameworkMappingInput[];
  controlMappings: ControlMappingInput[]; metadata: Record<string, unknown>; options?: AssessmentAnswerOption[];
  createdAt: string; updatedAt: string;
}

export interface AssessmentSection {
  id: string; templateId: string; parentSectionId: string | null; title: string; description: string | null;
  code: string | null; guidance: string | null; position: number; weight: number; isRequired: boolean;
  collapseByDefault: boolean; conditionalLogic: ConditionTree; visibilityRules: ConditionTree;
  questions?: AssessmentQuestion[]; children?: AssessmentSection[]; createdAt: string; updatedAt: string;
}

export interface AssessmentTemplate {
  id: string; organizationId: string; code: string | null; title: string; description: string | null;
  type: AssessmentTypeKey; categoryId: string | null; version: number; status: TemplateStatus; isPublished: boolean;
  isArchived: boolean; archivedAt: string | null; archivedBy: string | null; parentTemplateId: string | null;
  latestVersionId: string | null; defaultLanguage: string; estimatedDurationMinutes: number | null;
  instructions: string | null; scoringConfig: Record<string, unknown>; settings: Record<string, unknown>;
  tags: string[]; createdBy: string | null; updatedBy: string | null; createdAt: string; updatedAt: string;
  category?: AssessmentCategory | null;
}

export interface FrameworkMappingInput {
  framework: FrameworkKey; frameworkId?: string | null; requirementId?: string | null; controlId?: string | null;
  clauseCode?: string | null; mappingStrength?: 'direct' | 'partial' | 'indirect'; notes?: string | null;
}
export interface ControlMappingInput {
  controlSource: 'existing_control' | 'internal_standard' | 'customer_code'; controlId?: string | null;
  controlCode?: string | null; controlTitle?: string | null; mappingStrength?: 'direct' | 'partial' | 'indirect'; notes?: string | null;
}

export interface AssessmentDependency { id: string; templateId: string; questionId: string; dependsOnQuestionId: string; dependencyType: string; condition: ConditionTree; createdAt: string }
export interface AssessmentCondition { id: string; organizationId: string; templateId: string | null; name: string | null; description: string | null; logic: ConditionTree; createdAt: string; updatedAt: string }
export interface AssessmentScoringRule { id: string; organizationId: string; templateId: string; name: string; method: ScoringMethod; scope: string; targetId: string | null; config: Record<string, unknown>; appliesWhen: ConditionTree; position: number; isActive: boolean; createdAt: string; updatedAt: string }
export interface AssessmentValidationRule { id: string; organizationId: string; templateId: string; questionId: string | null; name: string | null; ruleType: ValidationRuleType; params: Record<string, unknown>; message: string | null; severity: 'error' | 'warning'; appliesWhen: ConditionTree; isActive: boolean; createdAt: string; updatedAt: string }
export interface AssessmentFrameworkMapping { id: string; organizationId: string; templateId: string; questionId: string | null; sectionId: string | null; framework: FrameworkKey; frameworkId: string | null; requirementId: string | null; controlId: string | null; clauseCode: string | null; mappingStrength: string; notes: string | null; createdAt: string }
export interface AssessmentControlMapping { id: string; organizationId: string; templateId: string; questionId: string | null; sectionId: string | null; controlSource: string; controlId: string | null; controlCode: string | null; controlTitle: string | null; mappingStrength: string; notes: string | null; createdAt: string }

export interface Assessment {
  id: string; organizationId: string; templateId: string; templateVersion: number; code: string | null; title: string;
  type: AssessmentTypeKey; categoryId: string | null; status: AssessmentStatusKey; scope: string; siteId: string | null;
  departmentId: string | null; teamId: string | null; assigneeId: string | null; createdBy: string | null;
  scheduledStartDate: string | null; scheduledEndDate: string | null; startedAt: string | null; submittedAt: string | null;
  completedAt: string | null; dueDate: string | null; progress: number; scoringSummary: Record<string, unknown>;
  tags: string[]; metadata: Record<string, unknown>; createdAt: string; updatedAt: string;
}

export interface AssessmentScore { id: string; assessmentId: string; questionId: string | null; sectionId: string | null; method: ScoringMethod; rawValue: number | null; normalizedScore: number | null; weightedScore: number | null; maxScore: number | null; label: string | null; passed: boolean | null; details: Record<string, unknown>; createdAt: string; updatedAt: string }
export interface AssessmentResponse { id: string; assessmentId: string; questionId: string; sectionId: string | null; respondentId: string | null; answerText: string | null; answerNumber: number | null; answerJson: Record<string, unknown>; selectedOptionIds: string[] | null; selectedValues: string[] | null; isSkipped: boolean; isFlagged: boolean; confidence: number | null; validationStatus: 'pending' | 'valid' | 'invalid'; validationMessages: string[]; answeredAt: string | null; createdAt: string; updatedAt: string }

export interface AssessmentAssignment { id: string; organizationId: string; assessmentId: string; assigneeId: string | null; assigneeRole: string | null; assignedBy: string | null; status: string; scope: string; targetId: string | null; dueDate: string | null; instructions: string | null; acceptedAt: string | null; completedAt: string | null; createdAt: string; updatedAt: string }
export interface AssessmentReview { id: string; organizationId: string; assessmentId: string; reviewerId: string | null; decision: string; scope: string; targetId: string | null; summary: string | null; scoreOverride: number | null; reviewedAt: string | null; createdAt: string; updatedAt: string }
export interface AssessmentApproval { id: string; organizationId: string; assessmentId: string; approverId: string | null; level: number; decision: string; notes: string | null; approvedAt: string | null; createdAt: string; updatedAt: string }
export interface AssessmentComment { id: string; organizationId: string; assessmentId: string; authorId: string | null; kind: string; scope: string; targetId: string | null; body: string; isResolved: boolean; parentCommentId: string | null; createdAt: string; updatedAt: string }
export interface AssessmentAttachment { id: string; organizationId: string; assessmentId: string; assessmentResponseId: string | null; uploadedBy: string | null; fileName: string; fileType: string | null; fileSize: number | null; storageKey: string; url: string | null; kind: string; createdAt: string }
export interface AssessmentSchedulePlaceholder { id: string; organizationId: string; templateId: string | null; name: string; frequency: string; intervalCount: number; anchorDay: number | null; anchorMonth: number | null; scope: string; siteId: string | null; departmentId: string | null; defaultAssigneeId: string | null; description: string | null; isActive: boolean; createdAt: string; updatedAt: string }

export interface AssessmentTemplateVersion { id: string; templateId: string; version: number; title: string; description: string | null; changeSummary: string | null; snapshot: Record<string, unknown>; createdBy: string | null; createdAt: string }

export interface TemplateStructure { template: AssessmentTemplate; sections: AssessmentSection[]; questions: AssessmentQuestion[] }

export interface AssessmentLibraryItem extends AssessmentTemplate {
  frameworkCount: number; questionCount: number; sectionCount: number; categoryName: string | null;
}

export interface Paginated<T> { data: T[]; total: number; page: number; pageSize: number; totalPages: number }

export interface AssessmentDashboard {
  publishedTemplates: number; totalTemplates: number; totalAssessments: number; activeAssessments: number;
}

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentTypeKey, string> = {
  internal: 'Internal', supplier: 'Supplier', factory: 'Factory', self: 'Self',
  customer: 'Customer', pre_audit: 'Pre Audit', follow_up: 'Follow Up', custom: 'Custom',
};

export const ANSWER_TYPE_LABELS: Record<AnswerTypeKey, string> = {
  short_text: 'Short Text', long_text: 'Long Text', number: 'Number', currency: 'Currency',
  percentage: 'Percentage', date: 'Date', time: 'Time', datetime: 'Date & Time', dropdown: 'Dropdown',
  multiselect: 'Multi Select', checkbox: 'Checkbox', radio: 'Radio Button', yes_no: 'Yes / No',
  pass_fail: 'Pass / Fail', file: 'File Upload', image: 'Image Upload', video: 'Video Upload',
  audio: 'Audio Upload', signature: 'Signature', rating: 'Rating', risk_matrix: 'Risk Matrix',
  table: 'Table', location: 'Location',
};

export const FRAMEWORK_LABELS: Record<FrameworkKey, string> = {
  SMETA: 'SMETA', SA8000: 'SA8000', ISO_9001: 'ISO 9001', ISO_14001: 'ISO 14001', ISO_45001: 'ISO 45001',
  GRI: 'GRI', BSCI: 'BSCI', amfori: 'amfori', customer_code: 'Customer Code',
  internal_standard: 'Internal Standard', existing_control: 'Existing Control',
};

export const SCORING_METHOD_LABELS: Record<ScoringMethod, string> = {
  pass_fail: 'Pass / Fail', percentage: 'Percentage', weighted: 'Weighted', risk: 'Risk Score',
  compliance: 'Compliance', manual: 'Manual', automatic: 'Automatic',
};
