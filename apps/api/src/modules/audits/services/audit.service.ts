import { randomUUID } from 'node:crypto';

import { NotFoundError, BadRequestError } from '../../../core/errors.js';
import { audit } from '../../../core/audit.js';
import { query } from '../../../db/pool.js';
import type { AssessmentTemplate, AssessmentSection, AssessmentQuestion } from '../../assessments/types.js';
import type {
  AuditRecord,
  AuditSectionRecord,
  AuditQuestionResponseRecord,
  AuditObservationRecord,
  AuditFindingRecord,
  AuditEvidenceRecord,
  AuditInterviewRecord,
  AuditSignatureRecord,
  AuditCalendarRecord,
  AuditReminderRecord,
  AuditProgressRecord,
  AuditType,
  ObservationSeverity,
  FindingType,
  FindingPriority,
  FindingStatus,
  EvidenceType,
  InterviewType,
} from '../types.js';

export interface AuditTemplateStructure {
  template: AssessmentTemplate;
  sections: AssessmentSection[];
  questions: AssessmentQuestion[];
}

export interface AuditExecutionPlan {
  sections: AuditSectionRecord[];
  questionResponses: AuditQuestionResponseRecord[];
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

function mapAuditRow(row: Record<string, any>): AuditRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    auditNumber: row.audit_number,
    title: row.title,
    auditType: row.audit_type,
    status: row.status,
    templateId: row.template_id,
    factoryId: row.factory_id,
    supplierId: row.supplier_id,
    organizationUnitId: row.organization_unit_id,
    auditorId: row.auditor_id,
    leadAuditorId: row.lead_auditor_id,
    scheduledStartDate: row.scheduled_start_date,
    scheduledEndDate: row.scheduled_end_date,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    dueDate: row.due_date,
    progress: row.progress,
    riskRating: row.risk_rating,
    description: row.description,
    tags: row.tags ?? [],
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildAuditSectionsFromTemplate(input: AuditTemplateStructure): AuditExecutionPlan {
  const sections = input.sections.map((section, index) => ({
    id: randomUUID(),
    auditId: '',
    sourceSectionId: section.id,
    title: section.title,
    description: section.description ?? null,
    position: section.position ?? index + 1,
    progress: 0,
    isRequired: section.isRequired ?? true,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const questionResponses = input.questions.map((question, _index) => ({
    id: randomUUID(),
    auditId: '',
    auditSectionId: sections.find((s) => s.sourceSectionId === question.sectionId)?.id ?? null,
    questionId: question.id,
    sourceQuestionId: question.id,
    questionLabel: question.label,
    answerType: question.answerTypeKey,
    responseText: null,
    responseJson: {},
    selectedValues: [],
    comments: null,
    score: null,
    isRequired: question.isRequired ?? false,
    isCompleted: false,
    isSkipped: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return { sections, questionResponses };
}

export interface CreateAuditInput {
  organizationId: string;
  title: string;
  auditType: AuditType;
  templateId?: string | null;
  factoryId?: string | null;
  supplierId?: string | null;
  organizationUnitId?: string | null;
  auditorId?: string | null;
  leadAuditorId?: string | null;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  dueDate?: string | null;
  description?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export const auditExecutionService = {
  async createAudit(organizationId: string, input: CreateAuditInput, actorId?: string | null): Promise<AuditRecord> {
    const auditNumber = `${slugify(input.title).slice(0, 12)}-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const record: AuditRecord = {
      id: randomUUID(),
      organizationId,
      auditNumber,
      title: input.title,
      auditType: input.auditType,
      status: 'draft',
      templateId: input.templateId ?? null,
      factoryId: input.factoryId ?? null,
      supplierId: input.supplierId ?? null,
      organizationUnitId: input.organizationUnitId ?? null,
      auditorId: input.auditorId ?? null,
      leadAuditorId: input.leadAuditorId ?? null,
      scheduledStartDate: input.scheduledStartDate ?? null,
      scheduledEndDate: input.scheduledEndDate ?? null,
      startedAt: null,
      completedAt: null,
      dueDate: input.dueDate ?? null,
      progress: 0,
      riskRating: null,
      description: input.description ?? null,
      tags: input.tags ?? [],
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    await query(
      `INSERT INTO audits (id, organization_id, audit_number, title, audit_type, status, template_id, factory_id, supplier_id, organization_unit_id, auditor_id, lead_auditor_id, scheduled_start_date, scheduled_end_date, started_at, completed_at, due_date, progress, risk_rating, description, tags, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
      [record.id, record.organizationId, record.auditNumber, record.title, record.auditType, record.status, record.templateId, record.factoryId, record.supplierId, record.organizationUnitId, record.auditorId, record.leadAuditorId, record.scheduledStartDate, record.scheduledEndDate, record.startedAt, record.completedAt, record.dueDate, record.progress, record.riskRating, record.description, JSON.stringify(record.tags), JSON.stringify(record.metadata), record.createdAt, record.updatedAt],
    );

    await query(
      `INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`,
      [record.id, record.status, 'Audit created', now],
    );

    await audit({ organizationId, actorId: actorId ?? null, action: 'audit.create', entity: 'audit', entityId: record.id });
    return record;
  },

  async startAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    if (current.status === 'completed') throw new BadRequestError('Audit already completed');
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, started_at = COALESCE(started_at, $2), updated_at = $3 WHERE id = $4`, ['in_progress', now, now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'in_progress', 'Audit started', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.start', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async pauseAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3`, ['paused', now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'paused', 'Audit paused', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.pause', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async resumeAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3`, ['in_progress', now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'in_progress', 'Audit resumed', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.resume', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async saveDraft(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3`, ['draft', now, auditId]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.save_draft', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async completeSection(auditId: string, sectionId: string, actorId?: string | null): Promise<void> {
    await query(`UPDATE audit_sections SET is_completed = TRUE, progress = 100, updated_at = now() WHERE audit_id = $1 AND id = $2`, [auditId, sectionId]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.section.complete', entity: 'audit_section', entityId: sectionId });
  },

  async completeAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, completed_at = COALESCE(completed_at, $2), progress = 100, updated_at = $3 WHERE id = $4`, ['completed', now, now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'completed', 'Audit completed', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.complete', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async cancelAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3`, ['cancelled', now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'cancelled', 'Audit cancelled', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.cancel', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async reopenAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const now = new Date().toISOString();
    await query(`UPDATE audits SET status = $1, updated_at = $2 WHERE id = $3`, ['reopened', now, auditId]);
    await query(`INSERT INTO audit_status_history (audit_id, status, note, created_at) VALUES ($1, $2, $3, $4)`, [auditId, 'reopened', 'Audit reopened', now]);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.reopen', entity: 'audit', entityId: auditId });
    return this.getAudit(auditId);
  },

  async cloneAudit(auditId: string, actorId?: string | null): Promise<AuditRecord> {
    const current = await this.getAudit(auditId);
    const cloned = await this.createAudit(current.organizationId, {
      organizationId: current.organizationId,
      title: `${current.title} (copy)`,
      auditType: current.auditType,
      templateId: current.templateId,
      factoryId: current.factoryId,
      supplierId: current.supplierId,
      organizationUnitId: current.organizationUnitId,
      auditorId: current.auditorId,
      leadAuditorId: current.leadAuditorId,
      dueDate: current.dueDate,
      description: current.description,
      tags: current.tags,
      metadata: current.metadata,
    }, actorId);
    await audit({ organizationId: current.organizationId, actorId: actorId ?? null, action: 'audit.clone', entity: 'audit', entityId: cloned.id, metadata: { sourceId: auditId } });
    return cloned;
  },

  async getAudit(auditId: string): Promise<AuditRecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM audits WHERE id = $1`, [auditId]);
    const row = rows[0];
    if (!row) throw new NotFoundError('Audit not found');
    return mapAuditRow(row);
  },

  async listAudits(organizationId: string): Promise<AuditRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM audits WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows.map(mapAuditRow);
  },

  async createObservation(auditId: string, input: { observationType: string; severity: ObservationSeverity; category?: string | null; description: string; recommendation?: string | null; linkedStandardId?: string | null; linkedRequirementId?: string | null; linkedControlId?: string | null }, actorId?: string | null): Promise<AuditObservationRecord> {
    const record: AuditObservationRecord = {
      id: randomUUID(),
      auditId,
      observationType: input.observationType,
      severity: input.severity,
      category: input.category ?? null,
      description: input.description,
      recommendation: input.recommendation ?? null,
      linkedStandardId: input.linkedStandardId ?? null,
      linkedRequirementId: input.linkedRequirementId ?? null,
      linkedControlId: input.linkedControlId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_observations (id, audit_id, observation_type, severity, category, description, recommendation, linked_standard_id, linked_requirement_id, linked_control_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`, [record.id, record.auditId, record.observationType, record.severity, record.category, record.description, record.recommendation, record.linkedStandardId, record.linkedRequirementId, record.linkedControlId, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.observation.create', entity: 'audit_observation', entityId: record.id });
    return record;
  },

  async createFinding(auditId: string, input: { observationId?: string | null; findingType: FindingType; severity: ObservationSeverity; priority: FindingPriority; status: FindingStatus; riskRating?: string | null; title: string; description?: string | null; recommendation?: string | null }, actorId?: string | null): Promise<AuditFindingRecord> {
    const record: AuditFindingRecord = {
      id: randomUUID(),
      auditId,
      observationId: input.observationId ?? null,
      findingType: input.findingType,
      severity: input.severity,
      priority: input.priority,
      status: input.status,
      riskRating: input.riskRating ?? null,
      title: input.title,
      description: input.description ?? null,
      recommendation: input.recommendation ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_findings (id, audit_id, observation_id, finding_type, severity, priority, status, risk_rating, title, description, recommendation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [record.id, record.auditId, record.observationId, record.findingType, record.severity, record.priority, record.status, record.riskRating, record.title, record.description, record.recommendation, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.finding.create', entity: 'audit_finding', entityId: record.id });
    return record;
  },

  async addEvidence(auditId: string, input: { evidenceType: EvidenceType; title: string; description?: string | null; metadata?: Record<string, unknown>; gpsLocation?: string | null; observedAt?: string | null; fileName?: string | null; storageKey?: string | null; previewUrl?: string | null }, actorId?: string | null): Promise<AuditEvidenceRecord> {
    const record: AuditEvidenceRecord = {
      id: randomUUID(),
      auditId,
      evidenceType: input.evidenceType,
      title: input.title,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      gpsLocation: input.gpsLocation ?? null,
      observedAt: input.observedAt ?? null,
      fileName: input.fileName ?? null,
      storageKey: input.storageKey ?? null,
      previewUrl: input.previewUrl ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_evidence (id, audit_id, evidence_type, title, description, metadata, gps_location, observed_at, file_name, storage_key, preview_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, [record.id, record.auditId, record.evidenceType, record.title, record.description, JSON.stringify(record.metadata), record.gpsLocation, record.observedAt, record.fileName, record.storageKey, record.previewUrl, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.evidence.add', entity: 'audit_evidence', entityId: record.id });
    return record;
  },

  async createInterview(auditId: string, input: { interviewType: InterviewType; subjectName?: string | null; title: string; summary?: string | null; notes?: string | null }, actorId?: string | null): Promise<AuditInterviewRecord> {
    const record: AuditInterviewRecord = {
      id: randomUUID(),
      auditId,
      interviewType: input.interviewType,
      subjectName: input.subjectName ?? null,
      title: input.title,
      summary: input.summary ?? null,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_interviews (id, audit_id, interview_type, subject_name, title, summary, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [record.id, record.auditId, record.interviewType, record.subjectName, record.title, record.summary, record.notes, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.interview.create', entity: 'audit_interview', entityId: record.id });
    return record;
  },

  async addSignature(auditId: string, input: { signerType: string; signerName: string; signatureData?: string | null; signedAt?: string | null; verified?: boolean }, actorId?: string | null): Promise<AuditSignatureRecord> {
    const record: AuditSignatureRecord = {
      id: randomUUID(),
      auditId,
      signerType: input.signerType,
      signerName: input.signerName,
      signatureData: input.signatureData ?? null,
      signedAt: input.signedAt ?? null,
      verified: input.verified ?? false,
      createdAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_signatures (id, audit_id, signer_type, signer_name, signature_data, signed_at, verified, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [record.id, record.auditId, record.signerType, record.signerName, record.signatureData, record.signedAt, record.verified, record.createdAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.signature.add', entity: 'audit_signature', entityId: record.id });
    return record;
  },

  async createCalendarEvent(auditId: string, input: { calendarDate: string; viewType: string; title: string; details?: string | null }, actorId?: string | null): Promise<AuditCalendarRecord> {
    const record: AuditCalendarRecord = {
      id: randomUUID(),
      auditId,
      calendarDate: input.calendarDate,
      viewType: input.viewType,
      title: input.title,
      details: input.details ?? null,
      createdAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_calendar (id, audit_id, calendar_date, view_type, title, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [record.id, record.auditId, record.calendarDate, record.viewType, record.title, record.details, record.createdAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.calendar.create', entity: 'audit_calendar', entityId: record.id });
    return record;
  },

  async addReminder(auditId: string, input: { reminderAt: string; message: string; sent?: boolean }, actorId?: string | null): Promise<AuditReminderRecord> {
    const record: AuditReminderRecord = {
      id: randomUUID(),
      auditId,
      reminderAt: input.reminderAt,
      message: input.message,
      sent: input.sent ?? false,
      createdAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_reminders (id, audit_id, reminder_at, message, sent, created_at) VALUES ($1, $2, $3, $4, $5, $6)`, [record.id, record.auditId, record.reminderAt, record.message, record.sent, record.createdAt]);
    await audit({ organizationId: (await this.getAudit(auditId)).organizationId, actorId: actorId ?? null, action: 'audit.reminder.add', entity: 'audit_reminder', entityId: record.id });
    return record;
  },

  async getProgress(auditId: string): Promise<AuditProgressRecord> {
    const { rows } = await query<AuditProgressRecord>(`SELECT * FROM audit_progress WHERE audit_id = $1 ORDER BY updated_at DESC LIMIT 1`, [auditId]);
    const row = rows[0];
    if (!row) throw new NotFoundError('Audit progress not found');
    return row;
  },

  async refreshProgress(auditId: string): Promise<AuditProgressRecord> {
    const { rows } = await query<{ total: string; completed: string }>(`SELECT COUNT(*)::text AS total, COUNT(*) FILTER (WHERE is_completed = TRUE)::text AS completed FROM audit_sections WHERE audit_id = $1`, [auditId]);
    const totalSections = Number(rows[0]?.total ?? 0);
    const completedSections = Number(rows[0]?.completed ?? 0);
    const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
    const record: AuditProgressRecord = {
      id: randomUUID(),
      auditId,
      overallProgress: progress,
      sectionProgress: progress,
      questionProgress: progress,
      completionPercentage: progress,
      estimatedRemainingMinutes: null,
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO audit_progress (id, audit_id, overall_progress, section_progress, question_progress, completion_percentage, estimated_remaining_minutes, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [record.id, record.auditId, record.overallProgress, record.sectionProgress, record.questionProgress, record.completionPercentage, record.estimatedRemainingMinutes, record.updatedAt]);
    await query(`UPDATE audits SET progress = $1, updated_at = $2 WHERE id = $3`, [progress, record.updatedAt, auditId]);
    return record;
  },
};
