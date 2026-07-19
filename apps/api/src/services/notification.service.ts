import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { notificationRepo } from '../repositories/notification.repo.js';
import { notificationPreferenceRepo } from '../repositories/notification-preference.repo.js';
import { notificationDeliveryRepo } from '../repositories/notification-delivery.repo.js';
import { organizationRepo } from '../repositories/organization.repo.js';

export interface NotificationInput {
  organizationId: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  userId?: string;
  type?: string;
  channel?: string;
  read?: boolean;
  archived?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationService = {
  async createNotification(input: NotificationInput, actorId?: string) {
    const org = await organizationRepo.findById(input.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    const notification = await notificationRepo.create(input);
    await audit({ organizationId: input.organizationId, actorId: actorId ?? null, action: 'notification.create', entity: 'notification', entityId: notification.id });
    return notification;
  },

  async getNotification(orgId, id) {
    const notification = await notificationRepo.findById(id);
    if (!notification || notification.organizationId !== orgId) throw new NotFoundError('Notification not found');
    return notification;
  },

  async listNotifications(orgId, userId, filters: NotificationFilters = {}) {
    return notificationRepo.findByOrganization(orgId, { ...filters, userId });
  },

  async markAsRead(orgId, id, userId) {
    const notification = await notificationRepo.findById(id);
    if (!notification || notification.organizationId !== orgId) throw new NotFoundError('Notification not found');
    const updated = await notificationRepo.markAsRead(id, userId);
    await audit({ organizationId: orgId, actorId: userId, action: 'notification.mark_read', entity: 'notification', entityId: id });
    return updated;
  },

  async archiveNotification(orgId, id, userId) {
    const notification = await notificationRepo.findById(id);
    if (!notification || notification.organizationId !== orgId) throw new NotFoundError('Notification not found');
    const updated = await notificationRepo.archive(id, userId);
    await audit({ organizationId: orgId, actorId: userId, action: 'notification.archive', entity: 'notification', entityId: id });
    return updated;
  },

  async deleteNotification(orgId, id, userId) {
    const notification = await notificationRepo.findById(id);
    if (!notification || notification.organizationId !== orgId) throw new NotFoundError('Notification not found');
    await notificationRepo.softDelete(id, userId);
    await audit({ organizationId: orgId, actorId: userId, action: 'notification.delete', entity: 'notification', entityId: id });
  },

  async setPreference(orgId, userId, channel, notificationType, enabled) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const pref = await notificationPreferenceRepo.upsert({ organizationId: orgId, userId, channel, notificationType, enabled });
    await audit({ organizationId: orgId, actorId: userId, action: 'notification.preference.update', entity: 'notification_preference', entityId: pref.id });
    return pref;
  },

  async getPreferences(orgId, userId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return notificationPreferenceRepo.findByUser(orgId, userId);
  },

  async bulkMarkAsRead(orgId, userId, ids) {
    await notificationRepo.bulkMarkAsRead(orgId, userId, ids);
    await audit({ organizationId: orgId, actorId: userId, action: 'notification.bulk_mark_read', entity: 'notification', metadata: { ids } });
  },

  async getUnreadCount(orgId, userId) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return notificationRepo.getUnreadCount(orgId, userId);
  },

  async createDelivery(orgId, notificationId, channel) {
    const notification = await notificationRepo.findById(notificationId);
    if (!notification || notification.organizationId !== orgId) throw new NotFoundError('Notification not found');
    return notificationDeliveryRepo.create({ organizationId: orgId, notificationId, channel, status: 'queued' });
  },

  async updateDeliveryStatus(id, status, error?) {
    return notificationDeliveryRepo.updateStatus(id, status, error);
  },

  async retryFailedDeliveries(orgId?) {
    const failed = orgId ? await notificationDeliveryRepo.listFailed(orgId) : await notificationDeliveryRepo.listFailed(null, 100);
    const results: any[] = [];
    for (const delivery of failed) {
      await notificationDeliveryRepo.incrementAttempt(delivery.id);
      results.push(delivery);
    }
    return results;
  },

  async sendNotification(notificationId) {
    const notification = await notificationRepo.findById(notificationId);
    if (!notification) throw new NotFoundError('Notification not found');

    const deliveries = await notificationDeliveryRepo.listByNotification(notificationId);
    for (const delivery of deliveries) {
      try {
        await notificationDeliveryRepo.updateStatus(delivery.id, 'sending');
        await this.simulateSend(notification, delivery);
        await notificationDeliveryRepo.updateStatus(delivery.id, 'sent');
      } catch (err) {
        await notificationDeliveryRepo.updateStatus(delivery.id, 'failed', err instanceof Error ? err.message : String(err));
      }
    }
    return notification;
  },

  async simulateSend(_notification, _delivery) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  },
};
