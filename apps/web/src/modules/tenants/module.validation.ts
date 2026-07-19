import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().optional(),
  kind: z.enum(['consultancy', 'client']).optional(),
  logoUrl: z.string().url().optional(),
  branding: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().nullable().optional(),
  address: z.record(z.any()).nullable().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  siteId: z.string().uuid().nullable().optional(),
  code: z.string().nullable().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().uuid().nullable().optional(),
  code: z.string().nullable().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
