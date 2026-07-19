import { z } from 'zod';

export const statusUpdateSchema = z.object({
  caseId: z.string().min(1, 'Case is required'),
  updateType: z.string().min(1, 'Update type is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  isPublic: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  recipientType: z.string().min(1),
  channel: z.string().optional(),
});
export type StatusUpdateInput = z.infer<typeof statusUpdateSchema>;
