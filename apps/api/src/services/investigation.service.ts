import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { investigationRepo, investigationAssignmentRepo, investigationTimelineRepo } from '../repositories/investigation.repo.js';
import { investigatorRepo } from '../repositories/investigator.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface CreateInvestigationInput {
  leadInvestigator?: string | null;
  status?: string;
  scope?: string | null;
  methodology?: string | null;
  findingsSummary?: string | null;
  conclusion?: string | null;
}

export async function createInvestigation(caseId, leadInvestigatorId, actorId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.create({ caseId, leadInvestigator: leadInvestigatorId ?? null });
  await investigationTimelineRepo.create({
    investigationId: investigation.id,
    actorId: actorId ?? null,
    action: 'created',
    entityType: 'investigation',
    entityId: investigation.id,
    description: 'Investigation created',
  });
  await audit({ organizationId: case_.organizationId, actorId: actorId ?? null, action: 'investigation.create', entity: 'investigation', entityId: investigation.id });
  return investigation;
}

export async function getInvestigation(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) throw new NotFoundError('Investigation not found');
  const assignments = await investigationAssignmentRepo.findByInvestigationId(investigation.id);
  const timeline = await investigationTimelineRepo.listByInvestigation(investigation.id);
  return { ...investigation, assignments, timeline };
}

export async function updateInvestigation(caseId, patch, actorId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) throw new NotFoundError('Investigation not found');
  const updated = await investigationRepo.update(investigation.id, patch);
  if (updated) {
    await investigationTimelineRepo.create({
      investigationId: investigation.id,
      actorId: actorId ?? null,
      action: 'updated',
      entityType: 'investigation',
      entityId: investigation.id,
      description: 'Investigation updated',
    });
    await audit({ organizationId: case_.organizationId, actorId: actorId ?? null, action: 'investigation.update', entity: 'investigation', entityId: investigation.id });
  }
  return updated;
}

export async function assignInvestigator(caseId, investigatorId, assignedBy, role = 'investigator', notes = null) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) throw new NotFoundError('Investigation not found');
  if (await investigationAssignmentRepo.isAssigned(investigation.id, investigatorId)) {
    return investigationAssignmentRepo.findByInvestigationId(investigation.id).then((a) => a.find((a) => a.investigatorId === investigatorId));
  }
  const assignment = await investigationAssignmentRepo.create({
    investigationId: investigation.id,
    investigatorId,
    assignedBy,
    role,
    notes,
  });
  await investigatorRepo.updateWorkload(investigatorId, 1, 0);
  await investigationTimelineRepo.create({
    investigationId: investigation.id,
    actorId: assignedBy ?? null,
    action: 'assigned',
    entityType: 'investigator',
    entityId: investigatorId,
    description: `Investigator ${investigatorId} assigned as ${role}`,
  });
  await audit({ organizationId: case_.organizationId, actorId: assignedBy ?? null, action: 'investigation.assign', entity: 'investigation', entityId: investigation.id });
  return assignment;
}

export async function unassignInvestigator(caseId, investigatorId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) throw new NotFoundError('Investigation not found');
  const assignments = await investigationAssignmentRepo.findByInvestigationId(investigation.id);
  const assignment = assignments.find((a) => a.investigatorId === investigatorId);
  if (assignment) {
    await investigationAssignmentRepo.unassign(assignment.id);
    await investigatorRepo.updateWorkload(investigatorId, -1, 0);
    await investigationTimelineRepo.create({
      investigationId: investigation.id,
      actorId: null,
      action: 'updated',
      entityType: 'investigator',
      entityId: investigatorId,
      description: `Investigator ${investigatorId} unassigned`,
    });
  }
}

export async function listAssignments(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) return [];
  return investigationAssignmentRepo.findByInvestigationId(investigation.id);
}

export async function addTimelineEvent(caseId, actorId, action, entityType, entityId, description) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) throw new NotFoundError('Investigation not found');
  return investigationTimelineRepo.create({ investigationId: investigation.id, actorId, action, entityType, entityId, description });
}

export async function getTimeline(caseId) {
  const case_ = await caseRepo.findById(caseId);
  if (!case_) throw new NotFoundError('Case not found');
  const investigation = await investigationRepo.findByCaseId(caseId);
  if (!investigation) return [];
  return investigationTimelineRepo.listByInvestigation(investigation.id);
}

export async function getWorkload(orgId) {
  const investigators = await investigatorRepo.findByOrganization(orgId);
  const org = await organizationRepo.findById(orgId);
  if (!org) throw new NotFoundError('Organization not found');
  return investigators.map((inv) => ({
    ...inv,
    workload: investigatorRepo.getWorkload(inv.id),
  }));
}

export async function listInvestigators(orgId, filters: any = {}) {
  return investigatorRepo.listByOrganization(orgId, filters);
}
