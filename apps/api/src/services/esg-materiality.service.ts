import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { esgMaterialityTopicRepo } from '../repositories/esg-materiality.repo.js';
import { esgMaterialityAssessmentRepo } from '../repositories/esg-materiality-assessment.repo.js';

export const esgMaterialityService = {
  async listTopics(orgId: string, filter: Record<string, unknown> = {}) {
    const topics = await esgMaterialityTopicRepo.listByOrganization(orgId, {
      pillar: filter.pillar as string | undefined,
      category: filter.category as string | undefined,
      financialImpact: filter.financialImpact as string | undefined,
    });
    return { topics, total: topics.length };
  },

  async getTopic(orgId: string, id: string) {
    const topic = await esgMaterialityTopicRepo.findById(id, orgId);
    if (!topic) throw new NotFoundError('Materiality topic not found');
    return topic;
  },

  async createTopic(orgId: string, input: Record<string, unknown>) {
    const topic = await esgMaterialityTopicRepo.create({
      organizationId: orgId,
      name: input.name as string,
      description: input.description as string | undefined,
      category: input.category as string,
      pillar: input.pillar as string,
      externalDrivers: (input.externalDrivers as string[]) ?? [],
      internalDrivers: (input.internalDrivers as string[]) ?? [],
      stakeholderGroups: (input.stakeholderGroups as string[]) ?? [],
      impactScore: input.impactScore as number | undefined,
      likelihoodScore: input.likelihoodScore as number | undefined,
      financialImpact: input.financialImpact as string | undefined,
    });
    await audit({ action: 'esg.materiality_topic.create', entity: 'esg_materiality_topic', entityId: topic.id });
    return topic;
  },

  async updateTopic(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.impactScore !== undefined) patch.impactScore = input.impactScore;
    if (input.likelihoodScore !== undefined) patch.likelihoodScore = input.likelihoodScore;
    if (input.financialImpact !== undefined) patch.financialImpact = input.financialImpact;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const topic = await esgMaterialityTopicRepo.update(id, orgId, patch);
    if (!topic) throw new NotFoundError('Materiality topic not found');
    await audit({ action: 'esg.materiality_topic.update', entity: 'esg_materiality_topic', entityId: id });
    return topic;
  },

  async deleteTopic(orgId: string, id: string) {
    const existing = await esgMaterialityTopicRepo.findById(id, orgId);
    if (!existing) throw new NotFoundError('Materiality topic not found');
    await esgMaterialityTopicRepo.softDelete(id, orgId);
    await audit({ action: 'esg.materiality_topic.delete', entity: 'esg_materiality_topic', entityId: id });
    return { success: true };
  },

  async listAssessments(orgId: string, filter: Record<string, unknown> = {}) {
    const assessments = await esgMaterialityAssessmentRepo.listByOrganization(orgId, {
      periodId: filter.periodId as string | undefined,
      topicId: filter.topicId as string | undefined,
      approved: filter.approved !== undefined ? (filter.approved as boolean) : undefined,
    });
    return { assessments, total: assessments.length };
  },

  async getAssessment(orgId: string, id: string) {
    const assessment = await esgMaterialityAssessmentRepo.findById(id, orgId);
    if (!assessment) throw new NotFoundError('Materiality assessment not found');
    return assessment;
  },

  async createAssessment(orgId: string, input: Record<string, unknown>) {
    const assessment = await esgMaterialityAssessmentRepo.create({
      organizationId: orgId,
      topicId: input.topicId as string,
      periodId: input.periodId as string,
      impactScore: input.impactScore as number,
      likelihoodScore: input.likelihoodScore as number,
      stakeholderPriority: input.stakeholderPriority as number | undefined,
      financialMateriality: (input.financialMateriality as boolean) ?? false,
      impactMateriality: (input.impactMateriality as boolean) ?? false,
      overallPriorityScore: input.overallPriorityScore as number | undefined,
      justification: input.justification as string | undefined,
      assessedBy: input.assessedBy as string | undefined,
    });
    await audit({ action: 'esg.materiality_assessment.create', entity: 'esg_materiality_assessment', entityId: assessment.id });
    return assessment;
  },

  async updateAssessment(orgId: string, id: string, input: Record<string, unknown>) {
    const patch: Record<string, unknown> = {};
    if (input.impactScore !== undefined) patch.impactScore = input.impactScore;
    if (input.likelihoodScore !== undefined) patch.likelihoodScore = input.likelihoodScore;
    if (input.stakeholderPriority !== undefined) patch.stakeholderPriority = input.stakeholderPriority;
    if (input.financialMateriality !== undefined) patch.financialMateriality = input.financialMateriality;
    if (input.impactMateriality !== undefined) patch.impactMateriality = input.impactMateriality;
    if (input.overallPriorityScore !== undefined) patch.overallPriorityScore = input.overallPriorityScore;
    if (input.justification !== undefined) patch.justification = input.justification;
    if (input.approved !== undefined) patch.approved = input.approved;
    if (input.approvedBy !== undefined) patch.approvedBy = input.approvedBy;
    if (input.approvedAt !== undefined) patch.approvedAt = input.approvedAt;
    const assessment = await esgMaterialityAssessmentRepo.update(id, orgId, patch);
    if (!assessment) throw new NotFoundError('Materiality assessment not found');
    await audit({ action: 'esg.materiality_assessment.update', entity: 'esg_materiality_assessment', entityId: id });
    return assessment;
  },

  async listAssessmentsByPeriod(periodId: string, orgId: string) {
    return esgMaterialityAssessmentRepo.listByPeriod(periodId, orgId);
  },
};
