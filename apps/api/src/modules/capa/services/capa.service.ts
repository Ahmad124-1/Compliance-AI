import { randomUUID } from 'node:crypto';

import { audit } from '../../../core/audit.js';
import { NotFoundError } from '../../../core/errors.js';
import { query } from '../../../db/pool.js';
import type { CAPAApprovalRecord, CAPARecord, CAPATaskRecord, FindingRecord, NonConformityRecord, RootCauseRecord, RiskAssessmentRecord, VerificationChecklistRecord } from '../types.js';

function mapRow<T>(row: Record<string, any>): T { return row as T; }

export const capaService = {
  async createFinding(organizationId: string, input: Partial<FindingRecord> & { title: string; description?: string | null; category: string; severity: string }, actorId?: string | null): Promise<FindingRecord> {
    const record: FindingRecord = {
      id: randomUUID(),
      organizationId,
      title: input.title,
      description: input.description ?? null,
      category: input.category as any,
      severity: input.severity as any,
      status: 'open',
      linkedAuditId: input.linkedAuditId ?? null,
      linkedComplaintId: input.linkedComplaintId ?? null,
      linkedInvestigationId: input.linkedInvestigationId ?? null,
      linkedStandardId: input.linkedStandardId ?? null,
      linkedControlId: input.linkedControlId ?? null,
      ownerId: input.ownerId ?? null,
      assignedToId: input.assignedToId ?? null,
      riskRating: input.riskRating ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO findings (id, organization_id, title, description, category, severity, status, linked_audit_id, linked_complaint_id, linked_investigation_id, linked_standard_id, linked_control_id, owner_id, assigned_to_id, risk_rating, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`, [record.id, record.organizationId, record.title, record.description, record.category, record.severity, record.status, record.linkedAuditId, record.linkedComplaintId, record.linkedInvestigationId, record.linkedStandardId, record.linkedControlId, record.ownerId, record.assignedToId, record.riskRating, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'finding.create', entity: 'finding', entityId: record.id });
    return record;
  },

  async listFindings(organizationId: string): Promise<FindingRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM findings WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows.map(mapRow<FindingRecord>);
  },

  async createNonConformity(organizationId: string, input: Partial<NonConformityRecord> & { title: string; description?: string | null; severity: string }, actorId?: string | null): Promise<NonConformityRecord> {
    const record: NonConformityRecord = {
      id: randomUUID(),
      organizationId,
      findingId: input.findingId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: 'open',
      severity: input.severity as any,
      assignedToId: input.assignedToId ?? null,
      ownerId: input.ownerId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO non_conformities (id, organization_id, finding_id, title, description, status, severity, assigned_to_id, owner_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [record.id, record.organizationId, record.findingId, record.title, record.description, record.status, record.severity, record.assignedToId, record.ownerId, record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'non_conformity.create', entity: 'non_conformity', entityId: record.id });
    return record;
  },

  async listNonConformities(organizationId: string): Promise<NonConformityRecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM non_conformities WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows.map(mapRow<NonConformityRecord>);
  },

  async createCAPA(organizationId: string, input: Partial<CAPARecord> & { title: string; description?: string | null; priority: string; severity: string }, actorId?: string | null): Promise<CAPARecord> {
    const record: CAPARecord = {
      id: randomUUID(),
      organizationId,
      nonConformityId: input.nonConformityId ?? null,
      title: input.title,
      description: input.description ?? null,
      status: 'open',
      priority: input.priority as any,
      severity: input.severity as any,
      risk: input.risk ?? null,
      ownerId: input.ownerId ?? null,
      teamId: input.teamId ?? null,
      dueDate: input.dueDate ?? null,
      progress: 0,
      dependencies: input.dependencies ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO capas (id, organization_id, non_conformity_id, title, description, status, priority, severity, risk, owner_id, team_id, due_date, progress, dependencies, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`, [record.id, record.organizationId, record.nonConformityId, record.title, record.description, record.status, record.priority, record.severity, record.risk, record.ownerId, record.teamId, record.dueDate, record.progress, JSON.stringify(record.dependencies), record.createdAt, record.updatedAt]);
    await audit({ organizationId, actorId: actorId ?? null, action: 'capa.create', entity: 'capa', entityId: record.id });
    return record;
  },

  async listCAPAs(organizationId: string): Promise<CAPARecord[]> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM capas WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return rows.map(mapRow<CAPARecord>);
  },

  async createTask(capaId: string, input: Partial<CAPATaskRecord> & { title: string }, actorId?: string | null): Promise<CAPATaskRecord> {
    const record: CAPATaskRecord = {
      id: randomUUID(),
      capaId,
      title: input.title,
      description: input.description ?? null,
      status: 'open',
      assignedToId: input.assignedToId ?? null,
      dueDate: input.dueDate ?? null,
      progress: input.progress ?? 0,
      parentTaskId: input.parentTaskId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO capa_tasks (id, capa_id, title, description, status, assigned_to_id, due_date, progress, parent_task_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [record.id, record.capaId, record.title, record.description, record.status, record.assignedToId, record.dueDate, record.progress, record.parentTaskId, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getCAPA(capaId)).organizationId, actorId: actorId ?? null, action: 'capa.task.create', entity: 'capa_task', entityId: record.id });
    return record;
  },

  async getCAPA(id: string): Promise<CAPARecord> {
    const { rows } = await query<Record<string, any>>(`SELECT * FROM capas WHERE id = $1`, [id]);
    const row = rows[0];
    if (!row) throw new NotFoundError('CAPA not found');
    return mapRow<CAPARecord>(row);
  },

  async createRootCause(capaId: string, input: Partial<RootCauseRecord> & { description: string }, actorId?: string | null): Promise<RootCauseRecord> {
    const record: RootCauseRecord = {
      id: randomUUID(),
      capaId,
      category: input.category as any,
      description: input.description,
      contributingFactors: input.contributingFactors ?? [],
      correctiveRecommendation: input.correctiveRecommendation ?? null,
      preventiveRecommendation: input.preventiveRecommendation ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO root_causes (id, capa_id, category, description, contributing_factors, corrective_recommendation, preventive_recommendation, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [record.id, record.capaId, record.category, record.description, JSON.stringify(record.contributingFactors), record.correctiveRecommendation, record.preventiveRecommendation, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getCAPA(capaId)).organizationId, actorId: actorId ?? null, action: 'capa.root_cause.create', entity: 'root_cause', entityId: record.id });
    return record;
  },

  async createRiskAssessment(capaId: string, input: Partial<RiskAssessmentRecord> & { likelihood: number; impact: number; severity: string; priority: string }, actorId?: string | null): Promise<RiskAssessmentRecord> {
    const record: RiskAssessmentRecord = {
      id: randomUUID(),
      capaId,
      likelihood: input.likelihood,
      impact: input.impact,
      severity: input.severity,
      priority: input.priority,
      residualRisk: input.residualRisk ?? null,
      trend: input.trend ?? null,
      heatmapData: input.heatmapData ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO risk_assessments (id, capa_id, likelihood, impact, severity, priority, residual_risk, trend, heatmap_data, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [record.id, record.capaId, record.likelihood, record.impact, record.severity, record.priority, record.residualRisk, record.trend, JSON.stringify(record.heatmapData), record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getCAPA(capaId)).organizationId, actorId: actorId ?? null, action: 'capa.risk.create', entity: 'risk_assessment', entityId: record.id });
    return record;
  },

  async createVerificationChecklist(capaId: string, input: Partial<VerificationChecklistRecord> & { title: string }, actorId?: string | null): Promise<VerificationChecklistRecord> {
    const record: VerificationChecklistRecord = {
      id: randomUUID(),
      capaId,
      title: input.title,
      completed: input.completed ?? false,
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await query(`INSERT INTO verification_checklists (id, capa_id, title, completed, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [record.id, record.capaId, record.title, record.completed, record.notes, record.createdAt, record.updatedAt]);
    await audit({ organizationId: (await this.getCAPA(capaId)).organizationId, actorId: actorId ?? null, action: 'capa.verification.create', entity: 'verification_checklist', entityId: record.id });
    return record;
  },

  async createApproval(capaId: string, input: Partial<CAPAApprovalRecord> & { reviewerType: string; status: string }, actorId?: string | null): Promise<CAPAApprovalRecord> {
    const record: CAPAApprovalRecord = {
      id: randomUUID(),
      capaId,
      reviewerType: input.reviewerType,
      reviewerId: input.reviewerId ?? null,
      status: input.status as any,
      notes: input.notes ?? null,
      approvedAt: input.approvedAt ?? null,
      createdAt: new Date().toISOString(),
    };
    await query(`INSERT INTO capa_approvals (id, capa_id, reviewer_type, reviewer_id, status, notes, approved_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [record.id, record.capaId, record.reviewerType, record.reviewerId, record.status, record.notes, record.approvedAt, record.createdAt]);
    await audit({ organizationId: (await this.getCAPA(capaId)).organizationId, actorId: actorId ?? null, action: 'capa.approval.create', entity: 'capa_approval', entityId: record.id });
    return record;
  },
};
