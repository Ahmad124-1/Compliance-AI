import { z } from 'zod';

export const qrCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['organization', 'factory', 'department', 'campaign', 'poster']),
  url: z.string().min(1, 'Target URL is required'),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  configuration: z.record(z.any()).optional(),
});
export type QrCreateInput = z.infer<typeof qrCreateSchema>;
