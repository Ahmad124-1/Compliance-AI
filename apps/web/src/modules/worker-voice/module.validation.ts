import { z } from 'zod';

export const reportConcernSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  source: z.string().optional(),
  anonymous: z.boolean().optional(),
  language: z.string().min(2).max(5).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
});

export const emergencyReportSchema = z.object({
  emergencyType: z.string().min(1, 'Emergency type is required'),
  description: z.string().min(1, 'Description is required'),
  location: z.string().nullable().optional(),
  caseId: z.string().uuid().nullable().optional(),
  reporterName: z.string().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
});

export const qrGenerateSchema = z.object({
  name: z.string().min(1, 'QR name is required'),
  qrType: z.enum(['factory', 'department', 'dormitory', 'canteen', 'production_line', 'notice_board']),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  portalUrl: z.string().url('Enter a valid URL'),
});

export const evidenceUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  originalFilename: z.string().min(1, 'Original filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  sizeBytes: z.number().int().positive('Size must be positive'),
  storagePath: z.string().min(1, 'Storage path is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type ReportConcernInput = z.infer<typeof reportConcernSchema>;
export type EmergencyReportInput = z.infer<typeof emergencyReportSchema>;
export type QRGenerateInput = z.infer<typeof qrGenerateSchema>;
export type EvidenceUploadInput = z.infer<typeof evidenceUploadSchema>;
