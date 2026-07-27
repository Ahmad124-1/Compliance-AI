import { z } from 'zod';

export const profileUpdateSchema = z.object({
  position: z.string().optional(),
  bio: z.string().optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  profilePhotoUrl: z.string().url().optional(),
});

export const announcementCreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().optional(),
  priority: z.string().optional(),
  acknowledgementRequired: z.boolean().optional(),
  pinned: z.boolean().optional(),
  scheduledAt: z.string().optional(),
});

export const announcementUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  pinned: z.boolean().optional(),
});

export const formSubmitSchema = z.object({
  formType: z.enum(['leave', 'document_request', 'general', 'improvement', 'internal']),
  title: z.string().min(1),
  data: z.record(z.any()).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  taskType: z.enum(['task', 'capa', 'approval', 'form', 'event', 'training']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.string().optional(),
});

export const learningProgressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'certified']),
  progress: z.number().min(0).max(100).optional(),
  score: z.number().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;
export type FormSubmitInput = z.infer<typeof formSubmitSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type LearningProgressInput = z.infer<typeof learningProgressSchema>;
