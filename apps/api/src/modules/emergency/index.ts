import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { emergencyAlertRepo } from '../../repositories/emergency-alert.repo.js';
import { emergencyAcknowledgementRepo } from '../../repositories/emergency-alert.repo.js';

export interface EmergencyAlertInput {
  senderId?: string;
  title: string;
  body: string;
  alertType: string;
  priority?: string;
  severity?: string;
  scope?: Record<string, unknown>;
  channels?: string[];
  instructions?: string;
  requiresAcknowledgement?: boolean;
  escalationEnabled?: boolean;
  escalationAfterMinutes?: number;
  totalRecipients?: number;
  expiresAt?: string;
}

export const emergencyService = {
  async createAlert(orgId: string, userId: string | undefined, input: EmergencyAlertInput) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const alert = await emergencyAlertRepo.create({ organizationId: orgId, senderId: userId, ...input });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'emergency.create', entity: 'emergency_alert', entityId: alert.id });
    return alert;
  },

  async listAlerts(orgId: string, filters: { alertType?: string; isActive?: boolean; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return emergencyAlertRepo.listByOrganization(orgId, filters);
  },

  async getAlert(orgId: string, id: string) {
    const alert = await emergencyAlertRepo.findById(id);
    if (!alert || alert.organizationId !== orgId) throw new NotFoundError('Emergency alert not found');
    const acknowledgements = await emergencyAcknowledgementRepo.listByAlert(id);
    return { ...alert, acknowledgements };
  },

  async acknowledge(orgId: string, alertId: string, userId: string, input: { status?: string; note?: string; location?: Record<string, unknown> }) {
    const alert = await emergencyAlertRepo.findById(alertId);
    if (!alert || alert.organizationId !== orgId) throw new NotFoundError('Emergency alert not found');
    const acknowledgement = await emergencyAcknowledgementRepo.create({
      emergencyAlertId: alertId,
      organizationId: orgId,
      userId,
      status: input.status ?? 'acknowledged',
      note: input.note,
      location: input.location,
    });
    const acks = await emergencyAcknowledgementRepo.listByAlert(alertId);
    await emergencyAlertRepo.updateAcknowledgementCount(alertId, acks.length);
    await audit({ organizationId: orgId, actorId: userId, action: 'emergency.acknowledge', entity: 'emergency_alert', entityId: alertId });
    return acknowledgement;
  },

  async deactivate(orgId: string, id: string) {
    const alert = await emergencyAlertRepo.findById(id);
    if (!alert || alert.organizationId !== orgId) throw new NotFoundError('Emergency alert not found');
    const updated = await emergencyAlertRepo.deactivate(id);
    await audit({ organizationId: orgId, action: 'emergency.deactivate', entity: 'emergency_alert', entityId: id });
    return updated;
  },

  async delete(orgId: string, id: string) {
    const alert = await emergencyAlertRepo.findById(id);
    if (!alert || alert.organizationId !== orgId) throw new NotFoundError('Emergency alert not found');
    await emergencyAlertRepo.delete(id);
    await audit({ organizationId: orgId, action: 'emergency.delete', entity: 'emergency_alert', entityId: id });
  },
};
