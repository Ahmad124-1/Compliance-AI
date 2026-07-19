import { z } from 'zod';

export const notificationChannelSchema = z.enum(['in_app', 'email', 'sms', 'push', 'webhook', 'whatsapp']);
export const notificationTypeSchema = z.enum([
  'case_assigned',
  'case_status_changed',
  'case_escalated',
  'sla_breach',
  'sla_warning',
  'comment_added',
  'mention',
  'worker_update',
  'new_grievance',
  'system',
]);
export const notificationStatusSchema = z.enum(['unread', 'read', 'archived']);

export const notificationListParamsSchema = z.object({
  status: notificationStatusSchema.optional(),
  type: notificationTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});
export type NotificationListParams = z.infer<typeof notificationListParamsSchema>;

export const notificationCreateSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  type: notificationTypeSchema,
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  link: z.string().nullable().optional(),
  channels: z.array(notificationChannelSchema).min(1, 'Select at least one channel').optional(),
  metadata: z.record(z.any()).optional(),
});
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;

export const notificationUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  link: z.string().nullable().optional(),
  status: notificationStatusSchema.optional(),
  metadata: z.record(z.any()).optional(),
});
export type NotificationUpdateInput = z.infer<typeof notificationUpdateSchema>;

export const preferenceUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  channel: notificationChannelSchema.optional(),
  notificationType: notificationTypeSchema.optional(),
});
export type PreferenceUpdateInput = z.infer<typeof preferenceUpdateSchema>;
