import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationCommunicationSettingsRepo } from '../repositories/organization-communication-settings.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export const communicationSettingsService = {
  async getSettings(orgId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    let settings = await organizationCommunicationSettingsRepo.findByOrganization(orgId);
    if (!settings) {
      settings = await organizationCommunicationSettingsRepo.create({ organizationId: orgId });
    }
    return settings;
  },

  async updateSettings(orgId, patch, actorId?) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const updated = await organizationCommunicationSettingsRepo.update(orgId, patch);
    await audit({ organizationId: orgId, actorId: actorId ?? null, action: 'communication.settings.update', entity: 'organization_communication_settings', entityId: orgId });
    return updated;
  },

  async updateBranding(orgId, branding) {
    return this.updateSettings(orgId, { branding });
  },

  async updateChannels(orgId, channels) {
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(channels)) {
      patch[`${key}Enabled`] = value;
    }
    return this.updateSettings(orgId, patch);
  },

  async updateNotificationSettings(orgId, settings) {
    return this.updateSettings(orgId, { notificationSettings: settings });
  },

  async updatePrivacySettings(orgId, settings) {
    return this.updateSettings(orgId, { privacySettings: settings });
  },
};
