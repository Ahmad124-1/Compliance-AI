import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { notificationService } from '../services/notification.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const notificationCreateSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  channel: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.any()).optional(),
});

const preferenceSchema = z.object({
  channel: z.string().min(1),
  notificationType: z.string().min(1),
  enabled: z.boolean().optional(),
});

export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/notifications', { preHandler: requirePermission('notification:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as {
      type?: string;
      channel?: string;
      read?: string;
      archived?: string;
      limit?: string;
      offset?: string;
    };
    const { notifications } = await notificationService.listNotifications(auth.org, auth.sub, {
      type: q.type,
      channel: q.channel,
      read: q.read ? q.read === 'true' : undefined,
      archived: q.archived ? q.archived === 'true' : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    return { notifications, total: notifications.length };
  });

  app.get('/notifications/unread-count', { preHandler: requirePermission('notification:read') }, async (req) => {
    const auth = getAuth(req);
    const count = await notificationService.getUnreadCount(auth.org, auth.sub);
    return { count };
  });

  app.get('/notifications/stats', { preHandler: requirePermission('notification:read') }, async (req) => {
    const auth = getAuth(req);
    const unread = await notificationService.getUnreadCount(auth.org, auth.sub);
    return { unread, total: unread };
  });

  app.post('/notifications', { preHandler: requirePermission('notification:create'), schema: { body: notificationCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof notificationCreateSchema>;
    return notificationService.createNotification(
      {
        organizationId: auth.org,
        userId: body.userId,
        type: body.type,
        channel: body.channel,
        title: body.title,
        body: body.body,
        data: body.data,
      },
      auth.sub,
    );
  });

  app.get('/notifications/:id', { preHandler: requirePermission('notification:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return notificationService.getNotification(auth.org, id);
  });

  app.get('/notifications/:id/deliveries', { preHandler: requirePermission('notification:read') }, async (req) => {
    const { id } = req.params as { id: string };
    const { notificationDeliveryRepo } = await import('../repositories/notification-delivery.repo.js');
    return notificationDeliveryRepo.listByNotification(id);
  });

  app.patch('/notifications/:id', { preHandler: requirePermission('notification:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { read?: boolean; archived?: boolean };
    if (body.archived) return notificationService.archiveNotification(auth.org, id, auth.sub);
    if (body.read) return notificationService.markAsRead(auth.org, id, auth.sub);
    return notificationService.getNotification(auth.org, id);
  });

  app.delete('/notifications/:id', { preHandler: requirePermission('notification:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await notificationService.deleteNotification(auth.org, id, auth.sub);
    return { success: true };
  });

  app.post('/notifications/:id/read', { preHandler: requirePermission('notification:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return notificationService.markAsRead(auth.org, id, auth.sub);
  });

  app.post('/notifications/:id/unread', { preHandler: requirePermission('notification:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return notificationService.getNotification(auth.org, id);
  });

  app.post('/notifications/:id/archive', { preHandler: requirePermission('notification:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return notificationService.archiveNotification(auth.org, id, auth.sub);
  });

  app.post('/notifications/mark-all-read', { preHandler: requirePermission('notification:update') }, async (req) => {
    const auth = getAuth(req);
    const { notifications } = await notificationService.listNotifications(auth.org, auth.sub);
    await notificationService.bulkMarkAsRead(auth.org, auth.sub, notifications.map((n) => n.id));
    return { success: true };
  });

  app.get('/notifications/preferences', { preHandler: requirePermission('notification:read') }, async (req) => {
    const auth = getAuth(req);
    return notificationService.getPreferences(auth.org, auth.sub);
  });

  app.patch('/notifications/preferences/:id', { preHandler: requirePermission('notification:update'), schema: { body: preferenceSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof preferenceSchema>;
    return notificationService.setPreference(auth.org, auth.sub, body.channel, body.notificationType, body.enabled ?? true);
  });
}
