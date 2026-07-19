import { z } from 'zod';

export const caseCreateSchema = z.object({
  grievanceId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  source: z.string().min(1, 'Source is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email('Enter a valid email').nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  reporterAnonymous: z.boolean().optional(),
  factoryId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  country: z.string().nullable().optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  slaDeadline: z.string().datetime().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export const caseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['open', 'under_investigation', 'escalated', 'pending_review', 'resolved', 'closed', 'archived']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  reporterAnonymous: z.boolean().optional(),
  factoryId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  country: z.string().nullable().optional(),
  assignedTo: z.array(z.string().uuid()).optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  slaDeadline: z.string().datetime().nullable().optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  mergedInto: z.string().uuid().nullable().optional(),
  duplicateOf: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export const commentCreateSchema = z.object({
  body: z.string().min(1, 'Comment is required'),
  isInternal: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

export const noteCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
});

export const responseCreateSchema = z.object({
  body: z.string().min(1, 'Response is required'),
});

export const evidenceCreateSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  originalFilename: z.string().min(1, 'Original filename is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  sizeBytes: z.number().int().positive('Size must be positive'),
  storagePath: z.string().min(1, 'Storage path is required'),
  description: z.string().optional(),
  category: z.enum(['image', 'document', 'video', 'audio', 'other']).optional(),
  tags: z.array(z.string()).optional(),
});

export const witnessCreateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['witness', 'victim', 'bystander', 'expert']).optional(),
  statement: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  protectionLevel: z.enum(['standard', 'elevated', 'protected']).optional(),
});

export const interviewCreateSchema = z.object({
  witnessId: z.string().uuid().nullable().optional(),
  type: z.enum(['verbal', 'written', 'video', 'audio', 'forensic']).optional(),
  location: z.string().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  summary: z.string().min(1, 'Summary is required'),
  transcript: z.string().optional(),
  recordingPath: z.string().optional(),
  findings: z.string().optional(),
  isConfidential: z.boolean().optional(),
});

export const findingCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  confidence: z.enum(['low', 'medium', 'high', 'confirmed']).optional(),
  evidenceIds: z.array(z.string().uuid()).optional(),
  isFinal: z.boolean().optional(),
});

export const rootCauseCreateSchema = z.object({
  category: z.enum(['people', 'process', 'technology', 'environment', 'policy', 'training']),
  description: z.string().min(1, 'Description is required'),
  contributingFactors: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  verificationMethod: z.string().optional(),
});

export const resolutionCreateSchema = z.object({
  type: z.enum(['corrective', 'disciplinary', 'policy_change', 'training', 'compensation', 'warning', 'termination', 'other']),
  description: z.string().min(1, 'Description is required'),
  actionsTaken: z.string().min(1, 'Actions taken is required'),
  preventiveMeasures: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
  implementedAt: z.string().datetime().nullable().optional(),
  verifiedAt: z.string().datetime().nullable().optional(),
  verifiedBy: z.string().uuid().nullable().optional(),
  isFinal: z.boolean().optional(),
});

export const investigationCreateSchema = z.object({
  leadInvestigator: z.string().uuid().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'suspended']).optional(),
  scope: z.string().optional(),
  methodology: z.string().optional(),
  findingsSummary: z.string().optional(),
  conclusion: z.string().optional(),
});

export const assignmentCreateSchema = z.object({
  investigatorId: z.string().uuid(),
  role: z.enum(['lead', 'investigator', 'reviewer', 'observer']).optional(),
  notes: z.string().optional(),
});

export const linkCreateSchema = z.object({
  relatedCaseId: z.string().uuid(),
  linkType: z.enum(['related', 'duplicate', 'parent', 'child', 'follow_up']).optional(),
});

export const filterCreateSchema = z.object({
  name: z.string().min(1, 'Filter name is required'),
  filters: z.record(z.any()),
  isShared: z.boolean().optional(),
});

export const escalationCreateSchema = z.object({
  ruleId: z.string().uuid().nullable().optional(),
  escalatedTo: z.string().uuid().nullable().optional(),
  reason: z.string().min(1, 'Reason is required'),
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type ResponseCreateInput = z.infer<typeof responseCreateSchema>;
export type EvidenceCreateInput = z.infer<typeof evidenceCreateSchema>;
export type WitnessCreateInput = z.infer<typeof witnessCreateSchema>;
export type InterviewCreateInput = z.infer<typeof interviewCreateSchema>;
export type FindingCreateInput = z.infer<typeof findingCreateSchema>;
export type RootCauseCreateInput = z.infer<typeof rootCauseCreateSchema>;
export type ResolutionCreateInput = z.infer<typeof resolutionCreateSchema>;
export type InvestigationCreateInput = z.infer<typeof investigationCreateSchema>;
export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type LinkCreateInput = z.infer<typeof linkCreateSchema>;
export type FilterCreateInput = z.infer<typeof filterCreateSchema>;
export type EscalationCreateInput = z.infer<typeof escalationCreateSchema>;
