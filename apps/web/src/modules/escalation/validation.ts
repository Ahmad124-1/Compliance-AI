import { z } from 'zod';

export const conditionTypeSchema = z.enum([
  'priority',
  'status',
  'category',
  'assignee',
  'sla_remaining',
  'age',
  'label',
  'severity',
]);
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'in',
  'not_in',
]);

export const escalationConditionSchema = z.object({
  type: conditionTypeSchema,
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export const escalationLevelRefSchema = z.object({
  levelId: z.string().min(1),
  delayMinutes: z.number().int().min(0),
});

export const escalationRuleCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  entityType: z.string().min(1, 'Entity type is required'),
  isActive: z.boolean().optional(),
  logic: z.enum(['all', 'any']).optional(),
  conditions: z.array(escalationConditionSchema).min(1, 'Add at least one condition'),
  levels: z.array(escalationLevelRefSchema).min(1, 'Add at least one level'),
});
export type EscalationRuleCreateInput = z.infer<typeof escalationRuleCreateSchema>;

export const escalationRuleUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  entityType: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  logic: z.enum(['all', 'any']).optional(),
  conditions: z.array(escalationConditionSchema).optional(),
  levels: z.array(escalationLevelRefSchema).optional(),
});
export type EscalationRuleUpdateInput = z.infer<typeof escalationRuleUpdateSchema>;

export const escalationLevelCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  order: z.number().int().min(0),
  targetRole: z.string().nullable().optional(),
  targetUserId: z.string().nullable().optional(),
  targetTeamId: z.string().nullable().optional(),
  notifyChannels: z.array(z.string()).optional(),
  delayMinutes: z.number().int().min(0).optional(),
});
export type EscalationLevelCreateInput = z.infer<typeof escalationLevelCreateSchema>;
