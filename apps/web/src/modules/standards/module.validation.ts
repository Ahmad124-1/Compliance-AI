import { z } from 'zod';

export const standardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  publisher: z.string().optional(),
  category: z.enum(['quality', 'environment', 'social', 'energy', 'esg', 'custom']).optional(),
  isActive: z.boolean().optional(),
});

export const assignSchema = z.object({
  scope: z.enum(['organization', 'site', 'department']),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

export const controlStatusSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'implemented', 'not_applicable']),
  ownerId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const applicabilitySchema = z.object({
  applicable: z.boolean(),
  notes: z.string().nullable().optional(),
});

export type StandardInput = z.infer<typeof standardSchema>;
export type AssignInput = z.infer<typeof assignSchema>;
export type ControlStatusInput = z.infer<typeof controlStatusSchema>;
export type ApplicabilityInput = z.infer<typeof applicabilitySchema>;
