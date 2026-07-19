import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  key: z
    .string()
    .min(1, 'Key is required')
    .regex(/^[a-z0-9_-]+$/, 'Lowercase letters, digits, - and _ only'),
  description: z.string().optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
