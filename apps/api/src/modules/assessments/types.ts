// Assessment Framework Engine — domain types (mirror of DB rows & API contracts).

export type AssessmentTypeKey =
  | 'internal'
  | 'supplier'
  | 'factory'
  | 'self'
  | 'customer'
  | 'pre_audit'
  | 'follow_up'
  | 'custom';

export type AssessmentStatusKey =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type TemplateStatus = 'draft' | 'published' | 'archived';

export type AssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'expired';

export type ReviewDecision = 'pending' | 'approved' | 'rejected' | 'needs_changes';

export type CommentKind = 'general' | 'question' | 'section' | 'review' | 'system';

export type AnswerTypeKey =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'time'
  | 'datetime'
  | 'dropdown'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'yes_no'
  | 'pass_fail'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'signature'
  | 'rating'
  | 'risk_matrix'
  | 'table'
  | 'location';

export type ScoringMethod =
  | 'pass_fail'
  | 'percentage'
  | 'weighted'
  | 'risk'
  | 'compliance'
  | 'manual'
  | 'automatic';

export type ValidationRuleType =
  | 'required'
  | 'range'
  | 'pattern'
  | 'file'
  | 'answer'
  | 'custom'
  | 'conditional';

export type FrameworkKey =
  | 'SMETA'
  | 'SA8000'
  | 'ISO_9001'
  | 'ISO_14001'
  | 'ISO_45001'
  | 'GRI'
  | 'BSCI'
  | 'amfori'
  | 'customer_code'
  | 'internal_standard'
  | 'existing_control';

// --------------------------------------------------------------------------
// Catalogue
// --------------------------------------------------------------------------

export interface AssessmentAnswerType {
  id: string;
  organizationId: string;
  key: AnswerTypeKey;
  label: string;
  description: string | null;
  hasOptions: boolean;
  supportsValidation: boolean;
  isBuiltin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentCategory {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  description: string | null;
  color: string | null;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentTag {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  color: string | null;
  createdAt: Date;
}

export interface AssessmentTypeCatalogue {
  id: string;
  organizationId: string;
  type: AssessmentTypeKey;
  label: string;
  description: string | null;
  defaultScoringMethod: ScoringMethod | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// Templates, sections, questions
// --------------------------------------------------------------------------

export interface AssessmentAnswerOption {
  id: string;
  questionId: string;
  label: string;
  value: string;
  position: number;
  score: number;
  description: string | null;
  isDefault: boolean;
  conditionalLogic: ConditionTree | null;
  metadata: Record<string, unknown>;
}

export interface AssessmentQuestion {
  id: string;
  templateId: string;
  sectionId: string | null;
  parentQuestionId: string | null;
  groupId: string | null;
  code: string | null;
  label: string;
  helpText: string | null;
  answerTypeId: string | null;
  answerTypeKey: AnswerTypeKey;
  position: number;
  weight: number;
  isRequired: boolean;
  allowsMultiple: boolean;
  maxSelections: number | null;
  scoringConfig: ScoringConfig;
  validationRules: Record<string, unknown>;
  conditionalLogic: ConditionTree | null;
  visibilityRules: ConditionTree | null;
  dependencyRules: ConditionTree | null;
  frameworkMappings: FrameworkMappingInput[];
  controlMappings: ControlMappingInput[];
  metadata: Record<string, unknown>;
  options?: AssessmentAnswerOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentSection {
  id: string;
  templateId: string;
  parentSectionId: string | null;
  title: string;
  description: string | null;
  code: string | null;
  guidance: string | null;
  position: number;
  weight: number;
  isRequired: boolean;
  collapseByDefault: boolean;
  conditionalLogic: ConditionTree | null;
  visibilityRules: ConditionTree | null;
  questions?: AssessmentQuestion[];
  children?: AssessmentSection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentTemplate {
  id: string;
  organizationId: string;
  code: string | null;
  title: string;
  description: string | null;
  type: AssessmentTypeKey;
  categoryId: string | null;
  version: number;
  status: TemplateStatus;
  isPublished: boolean;
  isArchived: boolean;
  archivedAt: Date | null;
  archivedBy: string | null;
  parentTemplateId: string | null;
  latestVersionId: string | null;
  defaultLanguage: string;
  estimatedDurationMinutes: number | null;
  instructions: string | null;
  scoringConfig: ScoringConfig;
  settings: Record<string, unknown>;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  sections?: AssessmentSection[];
  category?: AssessmentCategory | null;
}

// --------------------------------------------------------------------------
// Conditions / dependencies
// --------------------------------------------------------------------------

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'in'
  | 'not_in'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'is_not_empty'
  | 'answered'
  | 'not_answered';

export type ConditionCombinator = 'AND' | 'OR';

export interface ConditionLeaf {
  kind: 'leaf';
  questionId: string;
  operator: ConditionOperator;
  value?: unknown;
}

export interface ConditionGroup {
  kind: 'group';
  combinator: ConditionCombinator;
  children: ConditionNode[];
}

export type ConditionNode = ConditionLeaf | ConditionGroup;
export type ConditionTree = ConditionNode | null;

export interface AssessmentCondition {
  id: string;
  organizationId: string;
  templateId: string | null;
  name: string | null;
  description: string | null;
  logic: ConditionTree;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentDependency {
  id: string;
  templateId: string;
  questionId: string;
  dependsOnQuestionId: string;
  dependencyType: 'requires_answer' | 'requires_value' | 'requires_option' | 'blocks_when';
  condition: ConditionTree;
  createdAt: Date;
}

// --------------------------------------------------------------------------
// Scoring & validation
// --------------------------------------------------------------------------

export interface ScoringConfig {
  method?: ScoringMethod;
  passThreshold?: number;
  maxScore?: number;
  weight?: number;
  scoringKey?: string;
  options?: { value: string; score: number }[];
  formula?: string;
  [key: string]: unknown;
}

export interface AssessmentScoringRule {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  method: ScoringMethod;
  scope: 'question' | 'section' | 'overall';
  targetId: string | null;
  config: Record<string, unknown>;
  appliesWhen: ConditionTree;
  position: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentValidationRule {
  id: string;
  organizationId: string;
  templateId: string;
  questionId: string | null;
  name: string | null;
  ruleType: ValidationRuleType;
  params: Record<string, unknown>;
  message: string | null;
  severity: 'error' | 'warning';
  appliesWhen: ConditionTree;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// Framework & control mappings
// --------------------------------------------------------------------------

export interface FrameworkMappingInput {
  framework: FrameworkKey;
  frameworkId?: string | null;
  requirementId?: string | null;
  controlId?: string | null;
  clauseCode?: string | null;
  mappingStrength?: 'direct' | 'partial' | 'indirect';
  notes?: string | null;
}

export interface ControlMappingInput {
  controlSource: 'existing_control' | 'internal_standard' | 'customer_code';
  controlId?: string | null;
  controlCode?: string | null;
  controlTitle?: string | null;
  mappingStrength?: 'direct' | 'partial' | 'indirect';
  notes?: string | null;
}

export interface AssessmentFrameworkMapping {
  id: string;
  organizationId: string;
  templateId: string;
  questionId: string | null;
  sectionId: string | null;
  framework: FrameworkKey;
  frameworkId: string | null;
  requirementId: string | null;
  controlId: string | null;
  clauseCode: string | null;
  mappingStrength: 'direct' | 'partial' | 'indirect';
  notes: string | null;
  createdAt: Date;
}

export interface AssessmentControlMapping {
  id: string;
  organizationId: string;
  templateId: string;
  questionId: string | null;
  sectionId: string | null;
  controlSource: string;
  controlId: string | null;
  controlCode: string | null;
  controlTitle: string | null;
  mappingStrength: string;
  notes: string | null;
  createdAt: Date;
}

// --------------------------------------------------------------------------
// Assessment instance, responses, scores
// --------------------------------------------------------------------------

export interface Assessment {
  id: string;
  organizationId: string;
  templateId: string;
  templateVersion: number;
  code: string | null;
  title: string;
  type: AssessmentTypeKey;
  categoryId: string | null;
  status: AssessmentStatusKey;
  scope: string;
  siteId: string | null;
  departmentId: string | null;
  teamId: string | null;
  assigneeId: string | null;
  createdBy: string | null;
  scheduledStartDate: Date | null;
  scheduledEndDate: Date | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  completedAt: Date | null;
  dueDate: Date | null;
  progress: number;
  scoringSummary: Record<string, unknown>;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentScore {
  id: string;
  assessmentId: string;
  questionId: string | null;
  sectionId: string | null;
  method: ScoringMethod;
  rawValue: number | null;
  normalizedScore: number | null;
  weightedScore: number | null;
  maxScore: number | null;
  label: string | null;
  passed: boolean | null;
  details: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  questionId: string;
  sectionId: string | null;
  respondentId: string | null;
  answerText: string | null;
  answerNumber: number | null;
  answerJson: Record<string, unknown>;
  selectedOptionIds: string[] | null;
  selectedValues: string[] | null;
  isSkipped: boolean;
  isFlagged: boolean;
  confidence: number | null;
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationMessages: string[];
  answeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// Workflow
// --------------------------------------------------------------------------

export interface AssessmentAssignment {
  id: string;
  organizationId: string;
  assessmentId: string;
  assigneeId: string | null;
  assigneeRole: string | null;
  assignedBy: string | null;
  status: AssignmentStatus;
  scope: string;
  targetId: string | null;
  dueDate: Date | null;
  instructions: string | null;
  acceptedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentReview {
  id: string;
  organizationId: string;
  assessmentId: string;
  reviewerId: string | null;
  decision: ReviewDecision;
  scope: string;
  targetId: string | null;
  summary: string | null;
  scoreOverride: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentApproval {
  id: string;
  organizationId: string;
  assessmentId: string;
  approverId: string | null;
  level: number;
  decision: ReviewDecision;
  notes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentComment {
  id: string;
  organizationId: string;
  assessmentId: string;
  authorId: string | null;
  kind: CommentKind;
  scope: string;
  targetId: string | null;
  body: string;
  isResolved: boolean;
  parentCommentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentAttachment {
  id: string;
  organizationId: string;
  assessmentId: string;
  assessmentResponseId: string | null;
  uploadedBy: string | null;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  storageKey: string;
  url: string | null;
  kind: string;
  createdAt: Date;
}

export interface AssessmentSchedulePlaceholder {
  id: string;
  organizationId: string;
  templateId: string | null;
  name: string;
  frequency: string;
  intervalCount: number;
  anchorDay: number | null;
  anchorMonth: number | null;
  scope: string;
  siteId: string | null;
  departmentId: string | null;
  defaultAssigneeId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// Versioning & composite DTOs
// --------------------------------------------------------------------------

export interface AssessmentTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  title: string;
  description: string | null;
  changeSummary: string | null;
  snapshot: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
}

export interface AssessmentTemplateFilters {
  search?: string;
  type?: AssessmentTypeKey;
  categoryId?: string;
  status?: TemplateStatus;
  tag?: string;
  framework?: string;
  industry?: string;
  factory?: string;
  organizationId?: string;
  version?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AssessmentLibraryItem extends AssessmentTemplate {
  frameworkCount: number;
  questionCount: number;
  sectionCount: number;
  categoryName: string | null;
}
