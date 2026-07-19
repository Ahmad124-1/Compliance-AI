import { z } from 'zod';

export const grievanceSubmitSchema = z.object({
  organizationId: z.string().uuid('Select an organization'),
  source: z.enum(['website', 'qr', 'email', 'sms', 'whatsapp', 'phone', 'walk-in', 'suggestion_box', 'ngo', 'union', 'government']).default('website'),
  category: z.string().min(1, 'Select a category'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  language: z.string().min(2).max(5).default('en'),
  anonymous: z.boolean().default(true),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email('Enter a valid email').nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  factory: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
});

export const grievanceTrackSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  trackingPIN: z.string().min(1, 'PIN is required'),
});

export const categoryCreateSchema = z.object({
  organizationId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
});

export const portalConfigSchema = z.object({
  theme: z.record(z.any()).optional(),
  languages: z.array(z.string()).optional(),
  customText: z.record(z.any()).optional(),
});

export const qrPortalCreateSchema = z.object({
  organizationId: z.string().uuid(),
  portalUrl: z.string().url('Enter a valid URL'),
  configuration: z.record(z.any()).optional(),
});

export type GrievanceSubmitInput = z.infer<typeof grievanceSubmitSchema>;
export type GrievanceTrackInput = z.infer<typeof grievanceTrackSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type PortalConfigInput = z.infer<typeof portalConfigSchema>;
export type QrPortalCreateInput = z.infer<typeof qrPortalCreateSchema>;
