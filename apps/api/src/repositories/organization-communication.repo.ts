import { query } from '../db/pool.js';
import { audit } from '../core/audit.js';

const mapOrganizationCommunicationSettings = (row) => ({
  id: row.id,
  organizationId: row.organization_id,
  defaultLanguage: row.default_language,
  supportedLanguages: row.supported_languages,
  branding: row.branding,
  emailAddress: row.email_address,
  smsSenderId: row.sms_sender_id,
  whatsappNumber: row.whatsapp_number,
  hotlineNumber: row.hotline_number,
  voiceRecordingEnabled: row.voice_recording_enabled,
  suggestionBoxEnabled: row.suggestion_box_enabled,
  walkInEnabled: row.walk_in_enabled,
  unionChannelEnabled: row.union_channel_enabled,
  ngoChannelEnabled: row.ngo_channel_enabled,
  governmentChannelEnabled: row.government_channel_enabled,
  mobileAppEnabled: row.mobile_app_enabled,
  notificationSettings: row.notification_settings,
  privacySettings: row.privacy_settings,
  retentionPolicyDays: row.retention_policy_days,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const organizationCommunicationRepo = {
  async findByOrg(orgId) {
    const { rows } = await query(`SELECT * FROM organization_communication_settings WHERE organization_id = $1`, [orgId]);
    return rows[0] ? mapOrganizationCommunicationSettings(rows[0]) : null;
  },

  async create(input) {
    const { rows } = await query(
      `INSERT INTO organization_communication_settings (organization_id, default_language, supported_languages, branding, email_address, sms_sender_id, whatsapp_number, hotline_number, voice_recording_enabled, suggestion_box_enabled, walk_in_enabled, union_channel_enabled, ngo_channel_enabled, government_channel_enabled, mobile_app_enabled, notification_settings, privacy_settings, retention_policy_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [
        input.organizationId,
        input.defaultLanguage ?? 'en',
        JSON.stringify(input.supportedLanguages ?? []),
        JSON.stringify(input.branding ?? {}),
        input.emailAddress ?? null,
        input.smsSenderId ?? null,
        input.whatsappNumber ?? null,
        input.hotlineNumber ?? null,
        input.voiceRecordingEnabled ?? false,
        input.suggestionBoxEnabled ?? false,
        input.walkInEnabled ?? false,
        input.unionChannelEnabled ?? false,
        input.ngoChannelEnabled ?? false,
        input.governmentChannelEnabled ?? false,
        input.mobileAppEnabled ?? false,
        JSON.stringify(input.notificationSettings ?? {}),
        JSON.stringify(input.privacySettings ?? {}),
        input.retentionPolicyDays ?? 2555,
      ],
    );
    return mapOrganizationCommunicationSettings(rows[0]);
  },

  async update(orgId, patch: any) {
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    const set = (col, val) => { sets.push(`${col} = $${i++}`); params.push(val); };
    if (patch.defaultLanguage !== undefined) set('default_language', patch.defaultLanguage);
    if (patch.supportedLanguages !== undefined) set('supported_languages', JSON.stringify(patch.supportedLanguages));
    if (patch.branding !== undefined) set('branding', JSON.stringify(patch.branding));
    if (patch.emailAddress !== undefined) set('email_address', patch.emailAddress);
    if (patch.smsSenderId !== undefined) set('sms_sender_id', patch.smsSenderId);
    if (patch.whatsappNumber !== undefined) set('whatsapp_number', patch.whatsappNumber);
    if (patch.hotlineNumber !== undefined) set('hotline_number', patch.hotlineNumber);
    if (patch.voiceRecordingEnabled !== undefined) set('voice_recording_enabled', patch.voiceRecordingEnabled);
    if (patch.suggestionBoxEnabled !== undefined) set('suggestion_box_enabled', patch.suggestionBoxEnabled);
    if (patch.walkInEnabled !== undefined) set('walk_in_enabled', patch.walkInEnabled);
    if (patch.unionChannelEnabled !== undefined) set('union_channel_enabled', patch.unionChannelEnabled);
    if (patch.ngoChannelEnabled !== undefined) set('ngo_channel_enabled', patch.ngoChannelEnabled);
    if (patch.governmentChannelEnabled !== undefined) set('government_channel_enabled', patch.governmentChannelEnabled);
    if (patch.mobileAppEnabled !== undefined) set('mobile_app_enabled', patch.mobileAppEnabled);
    if (patch.notificationSettings !== undefined) set('notification_settings', JSON.stringify(patch.notificationSettings));
    if (patch.privacySettings !== undefined) set('privacy_settings', JSON.stringify(patch.privacySettings));
    if (patch.retentionPolicyDays !== undefined) set('retention_policy_days', patch.retentionPolicyDays);
    if (!sets.length) return this.findByOrg(orgId);
    sets.push(`updated_at = now()`);
    params.push(orgId);
    const { rows } = await query(`UPDATE organization_communication_settings SET ${sets.join(', ')} WHERE organization_id = $${i} RETURNING *`, params);
    return rows[0] ? mapOrganizationCommunicationSettings(rows[0]) : null;
  },

  async upsert(input) {
    const existing = await this.findByOrg(input.organizationId);
    if (existing) {
      return this.update(input.organizationId, input);
    }
    await audit({ action: 'org_communication.create', entity: 'organization_communication_settings', entityId: input.organizationId, organizationId: input.organizationId });
    return this.create(input);
  },
};
