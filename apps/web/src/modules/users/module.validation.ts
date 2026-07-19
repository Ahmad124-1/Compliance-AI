import { z } from 'zod';

export const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  roleId: z.string().uuid().optional(),
  siteId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  teamId: z.string().uuid().optional(),
});

export type InviteInput = z.infer<typeof inviteSchema>;
