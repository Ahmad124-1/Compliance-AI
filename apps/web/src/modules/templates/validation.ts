import { z } from 'zod';

export const templateChannelSchema = z.enum(['email', 'sms', 'push', 'in_app', 'whatsapp', 'webhook']);
export const templateVariableTypeSchema = z.enum(['string', 'number', 'date', 'boolean']);

export const templateVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().nullable().optional(),
  type: templateVariableTypeSchema,
  required: z.boolean().optional(),
  defaultValue: z.string().nullable().optional(),
});
export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  channel: templateChannelSchema,
  category: z.string().min(1, 'Category is required'),
  subject: z.string().nullable().optional(),
  body: z.string().min(1, 'Body is required'),
  language: z.string().optional(),
  variables: z.array(templateVariableSchema).optional(),
  isActive: z.boolean().optional(),
});
export type MessageTemplateCreateInput = z.infer<typeof templateCreateSchema>;

export const templateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  channel: templateChannelSchema.optional(),
  category: z.string().min(1).optional(),
  subject: z.string().nullable().optional(),
  body: z.string().min(1).optional(),
  language: z.string().optional(),
  variables: z.array(templateVariableSchema).optional(),
  isActive: z.boolean().optional(),
});
export type MessageTemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

export const templateRenderSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.string()),
});
export type TemplateRenderInput = z.infer<typeof templateRenderSchema>;
