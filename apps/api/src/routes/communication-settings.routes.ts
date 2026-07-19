import type { FastifyInstance } from 'fastify';

import { communicationSettingsService } from '../services/communication-settings.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

export async function communicationSettingsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/communication-settings', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    return communicationSettingsService.getSettings(auth.org);
  });

  app.patch('/communication-settings', { preHandler: requirePermission('organization:update') }, async (req) => {
    const auth = getAuth(req);
    return communicationSettingsService.updateSettings(auth.org, req.body as Record<string, unknown>, auth.sub);
  });

  app.patch('/communication-settings/branding', { preHandler: requirePermission('organization:update') }, async (req) => {
    const auth = getAuth(req);
    const { branding } = req.body as { branding: Record<string, unknown> };
    return communicationSettingsService.updateBranding(auth.org, branding);
  });

  app.patch('/communication-settings/channels', { preHandler: requirePermission('organization:update') }, async (req) => {
    const auth = getAuth(req);
    return communicationSettingsService.updateChannels(auth.org, req.body as Record<string, boolean>);
  });

  app.patch('/communication-settings/notifications', { preHandler: requirePermission('organization:update') }, async (req) => {
    const auth = getAuth(req);
    return communicationSettingsService.updateNotificationSettings(auth.org, req.body as Record<string, unknown>);
  });

  app.patch('/communication-settings/privacy', { preHandler: requirePermission('organization:update') }, async (req) => {
    const auth = getAuth(req);
    return communicationSettingsService.updatePrivacySettings(auth.org, req.body as Record<string, unknown>);
  });
}
