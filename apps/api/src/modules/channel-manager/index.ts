import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { channelConfigRepo } from '../../repositories/channel-config.repo.js';

export interface ChannelRecommendation {
  channel: string;
  score: number;
  reason: string;
}

export const channelManagerService = {
  async getConfig(orgId: string, userId?: string) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return channelConfigRepo.listByOrganization(orgId, userId);
  },

  async setChannelPriority(orgId: string, userId: string | undefined, channel: string, priority: number, enabled = true, config: Record<string, unknown> = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const updated = await channelConfigRepo.upsert({ organizationId: orgId, userId, channel, priority, enabled, config });
    await audit({ organizationId: orgId, actorId: userId ?? null, action: 'channel_config.upsert', entity: 'channel_config', entityId: updated.id });
    return updated;
  },

  async selectOptimalChannel(orgId: string, message: { priority: string; recipientId?: string; category?: string }): Promise<ChannelRecommendation[]> {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');

    const channels = await channelConfigRepo.listByOrganization(orgId, message.recipientId);
    const defaultChannels = await channelConfigRepo.listByOrganization(orgId);

    const recommendations: ChannelRecommendation[] = [];
    const priorityMap: Record<string, number> = { emergency: 100, critical: 80, high: 60, normal: 40, low: 20 };
    const basePriority = priorityMap[message.priority] ?? 40;

    for (const ch of [...channels, ...defaultChannels]) {
      const score = (ch.enabled ? 50 : 0) + (100 - ch.priority) + basePriority;
      recommendations.push({
        channel: ch.channel,
        score,
        reason: ch.enabled ? `Priority ${ch.priority}, enabled` : 'Disabled',
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  },
};
