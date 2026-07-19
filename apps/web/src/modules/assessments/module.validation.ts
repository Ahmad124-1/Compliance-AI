import { z } from 'zod';

export const templateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['internal', 'supplier', 'factory', 'self', 'customer', 'pre_audit', 'follow_up', 'custom']),
  description: z.string().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  code: z.string().optional(),
  instructions: z.string().optional(),
  estimatedDurationMinutes: z.number().int().nullable().optional(),
  defaultLanguage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scoringConfig: z.record(z.any()).optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  code: z.string().optional(),
  guidance: z.string().optional(),
  position: z.number().int(),
  weight: z.number().optional(),
  isRequired: z.boolean().optional(),
  collapseByDefault: z.boolean().optional(),
  parentSectionId: z.string().uuid().nullable().optional(),
  conditionalLogic: z.any().nullable().optional(),
  visibilityRules: z.any().nullable().optional(),
});

export const optionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  position: z.number().int().default(0),
  score: z.number().default(0),
  description: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const questionSchema = z.object({
  label: z.string().min(1, 'Question label is required'),
  answerTypeKey: z.string().min(1),
  sectionId: z.string().uuid().nullable().optional(),
  parentQuestionId: z.string().uuid().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  code: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  position: z.number().int(),
  weight: z.number().optional(),
  isRequired: z.boolean().optional(),
  allowsMultiple: z.boolean().optional(),
  maxSelections: z.number().int().nullable().optional(),
  scoringConfig: z.record(z.any()).optional(),
  validationRules: z.record(z.any()).optional(),
  conditionalLogic: z.any().nullable().optional(),
  visibilityRules: z.any().nullable().optional(),
  dependencyRules: z.any().nullable().optional(),
  frameworkMappings: z.array(z.any()).optional(),
  controlMappings: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  options: z.array(optionSchema).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  position: z.number().int().optional(),
});

export const frameworkMappingSchema = z.object({
  framework: z.enum(['SMETA', 'SA8000', 'ISO_9001', 'ISO_14001', 'ISO_45001', 'GRI', 'BSCI', 'amfori', 'customer_code', 'internal_standard', 'existing_control']),
  frameworkId: z.string().uuid().nullable().optional(),
  requirementId: z.string().uuid().nullable().optional(),
  controlId: z.string().uuid().nullable().optional(),
  clauseCode: z.string().nullable().optional(),
  mappingStrength: z.enum(['direct', 'partial', 'indirect']).optional(),
  notes: z.string().nullable().optional(),
});

export const controlMappingSchema = z.object({
  controlSource: z.enum(['existing_control', 'internal_standard', 'customer_code']),
  controlId: z.string().uuid().nullable().optional(),
  controlCode: z.string().nullable().optional(),
  controlTitle: z.string().nullable().optional(),
  mappingStrength: z.enum(['direct', 'partial', 'indirect']).optional(),
  notes: z.string().nullable().optional(),
});

export const scoringRuleSchema = z.object({
  name: z.string().min(1),
  method: z.enum(['pass_fail', 'percentage', 'weighted', 'risk', 'compliance', 'manual', 'automatic']),
  scope: z.enum(['question', 'section', 'overall']).default('question'),
  targetId: z.string().uuid().nullable().optional(),
  config: z.record(z.any()).default({}),
  appliesWhen: z.any().nullable().optional(),
  position: z.number().int().optional(),
});

export const validationRuleSchema = z.object({
  name: z.string().nullable().optional(),
  questionId: z.string().uuid().nullable().optional(),
  ruleType: z.enum(['required', 'range', 'pattern', 'file', 'answer', 'custom', 'conditional']),
  params: z.record(z.any()).default({}),
  message: z.string().nullable().optional(),
  severity: z.enum(['error', 'warning']).default('error'),
  appliesWhen: z.any().nullable().optional(),
});

export type TemplateInput = z.infer<typeof templateSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type FrameworkMappingInputType = z.infer<typeof frameworkMappingSchema>;
export type ControlMappingInputType = z.infer<typeof controlMappingSchema>;
export type ScoringRuleInput = z.infer<typeof scoringRuleSchema>;
export type ValidationRuleInput = z.infer<typeof validationRuleSchema>;
