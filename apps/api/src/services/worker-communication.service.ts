import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { workerStatusUpdateRepo } from '../repositories/worker-status-update.repo.js';
import { workerCommunicationTimelineRepo } from '../repositories/worker-communication-timeline.repo.js';
import { caseRepo } from '../repositories/case.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface StatusUpdateInput {
  organizationId: string;
  caseId: string;
  updateType: string;
  title: string;
  message: string;
  isPublic?: boolean;
  isAnonymous?: boolean;
  recipientType: string;
  recipientIds?: string[];
  channel?: string;
  metadata?: Record<string, unknown>;
}

export const workerCommunicationService = {
  async sendStatusUpdate(input: StatusUpdateInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const case_ = await caseRepo.findById(input.caseId);
    if (!case_ || case_.organizationId !== input.organizationId) throw new NotFoundError('Case not found');
    const update = await workerStatusUpdateRepo.create(input);
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'worker.status_update', entity: 'worker_status_update', entityId: update.id });
    return update;
  },

  async getStatusUpdate(orgId, id) {
    const update = await workerStatusUpdateRepo.findById(id);
    if (!update || update.organizationId !== orgId) throw new NotFoundError('Status update not found');
    return update;
  },

  async listStatusUpdates(orgId, caseId) {
    if (caseId) {
      const case_ = await caseRepo.findById(caseId);
      if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
      return workerStatusUpdateRepo.findByCase(orgId, caseId);
    }
    return workerStatusUpdateRepo.listByOrganization(orgId);
  },

  async createTimelineEntry(orgId, caseId, actorType, action, description, metadata) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return workerCommunicationTimelineRepo.create({ organizationId: orgId, caseId, actorType, action, description, metadata });
  },

  async getTimeline(orgId, caseId) {
    const case_ = await caseRepo.findById(caseId);
    if (!case_ || case_.organizationId !== orgId) throw new NotFoundError('Case not found');
    return workerCommunicationTimelineRepo.findByCase(orgId, caseId);
  },

  async sendPublicMessage(orgId, caseId, message, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'public_message',
      title: 'Public Message',
      message,
      isPublic: true,
      isAnonymous: false,
      recipientType: 'all',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'message_sent', 'Public message sent', { message, actorId });
    return update;
  },

  async requestAdditionalInfo(orgId, caseId, message, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'additional_info_request',
      title: 'Additional Information Requested',
      message,
      isPublic: false,
      isAnonymous: false,
      recipientType: 'reporter',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'message_sent', 'Additional information requested', { message, actorId });
    return update;
  },

  async sendAcknowledgement(orgId, caseId, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'acknowledgement',
      title: 'Case Acknowledged',
      message: 'Your case has been acknowledged and is being reviewed.',
      isPublic: true,
      isAnonymous: false,
      recipientType: 'reporter',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'acknowledged', 'Case acknowledgement sent', { actorId });
    return update;
  },

  async sendResolutionNotice(orgId, caseId, message, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'resolution_notice',
      title: 'Resolution Notice',
      message,
      isPublic: true,
      isAnonymous: false,
      recipientType: 'all',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'message_sent', 'Resolution notice sent', { message, actorId });
    return update;
  },

  async sendCaseClosed(orgId, caseId, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'case_closed',
      title: 'Case Closed',
      message: 'Your case has been closed.',
      isPublic: true,
      isAnonymous: false,
      recipientType: 'all',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'message_sent', 'Case closed notice sent', { actorId });
    return update;
  },

  async requestFeedback(orgId, caseId, actorId) {
    const update = await this.sendStatusUpdate({
      organizationId: orgId,
      caseId,
      updateType: 'feedback_request',
      title: 'Feedback Requested',
      message: 'Please provide feedback on how your case was handled.',
      isPublic: true,
      isAnonymous: false,
      recipientType: 'reporter',
    }, actorId);
    await this.createTimelineEntry(orgId, caseId, actorId ? 'user' : 'system', 'message_sent', 'Feedback requested', { actorId });
    return update;
  },
};
