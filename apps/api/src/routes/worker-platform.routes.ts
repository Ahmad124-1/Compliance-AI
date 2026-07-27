import type { FastifyInstance } from 'fastify';

import { workerProfileService } from '../services/worker-profile.service.js';
import { workerDirectoryService } from '../services/worker-directory.service.js';
import { announcementsService } from '../services/announcements.service.js';
import { tasksService } from '../services/tasks.service.js';
import { documentsService } from '../services/documents.service.js';
import { formsService } from '../services/forms.service.js';
import { learningService } from '../services/learning.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';


export async function workerPlatformRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Worker Profile
  app.get('/workers/profile', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    return workerProfileService.getProfile(auth.org, auth.sub);
  });

  app.post('/workers/profile', { preHandler: requirePermission('profile:update') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return workerProfileService.createOrUpdate(auth.org, auth.sub, body);
  });

  app.patch('/workers/profile', { preHandler: requirePermission('profile:update') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return workerProfileService.createOrUpdate(auth.org, auth.sub, body);
  });

  // Worker Directory
  app.get('/workers/directory', { preHandler: requirePermission('user:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    const result = await workerDirectoryService.search(auth.org, {
      departmentId: q.departmentId,
      siteId: q.siteId,
      skill: q.skill,
      managerId: q.managerId,
      query: q.query,
    });
    return { workers: result, total: result.length };
  });

  // Announcements
  app.get('/workers/announcements', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    const result = await announcementsService.list(auth.org, {
      category: q.category,
      pinned: q.pinned ? q.pinned === 'true' : undefined,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
    return { announcements: result.announcements, total: result.total };
  });

  app.get('/workers/announcements/:id', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return announcementsService.get(auth.org, id);
  });

  app.post('/workers/announcements', { preHandler: requirePermission('announcement:create') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return announcementsService.create(auth.org, auth.sub, body);
  });

  app.patch('/workers/announcements/:id', { preHandler: requirePermission('announcement:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    return announcementsService.update(auth.org, id, body);
  });

  app.post('/workers/announcements/:id/read', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return announcementsService.markRead(auth.org, id, auth.sub);
  });

  app.post('/workers/announcements/:id/acknowledge', { preHandler: requirePermission('organization:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return announcementsService.acknowledge(auth.org, id, auth.sub);
  });

  // Tasks
  app.get('/workers/tasks', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    return tasksService.list(auth.org, auth.sub);
  });

  app.get('/workers/tasks/:id', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return tasksService.get(auth.org, id);
  });

  app.post('/workers/tasks', { preHandler: requirePermission('task:create') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return tasksService.create(auth.org, auth.sub, body);
  });

  app.post('/workers/tasks/:id/complete', { preHandler: requirePermission('task:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return tasksService.complete(auth.org, id);
  });

  // Documents
  app.get('/workers/documents', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as Record<string, string | undefined>;
    let docs = await documentsService.list(auth.org, auth.sub);
    if (q.category) docs = docs.filter((d) => d.category === q.category);
    return { documents: docs, total: docs.length };
  });

  app.get('/workers/documents/:id', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return documentsService.get(auth.org, id);
  });

  app.post('/workers/documents', { preHandler: requirePermission('document:create') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return documentsService.create(auth.org, auth.sub, body);
  });

  app.post('/workers/documents/:id/download', { preHandler: requirePermission('document:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return documentsService.download(auth.org, id);
  });

  // Forms
  app.get('/workers/forms', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    return formsService.list(auth.org, auth.sub);
  });

  app.get('/workers/forms/:id', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return formsService.get(auth.org, id);
  });

  app.post('/workers/forms', { preHandler: requirePermission('form:submit') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return formsService.submit(auth.org, auth.sub, body);
  });

  app.patch('/workers/forms/:id/status', { preHandler: requirePermission('form:approve') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    return formsService.review(auth.org, id, auth.sub, body.status as string, body.notes as string | undefined);
  });

  // Learning
  app.get('/workers/learning', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    return learningService.list(auth.org, auth.sub);
  });

  app.get('/workers/learning/:id', { preHandler: requirePermission('profile:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return learningService.get(auth.org, id);
  });

  app.post('/workers/learning', { preHandler: requirePermission('learning:enroll') }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as Record<string, unknown>;
    return learningService.enroll(auth.org, auth.sub, body);
  });

  app.post('/workers/learning/:id/progress', { preHandler: requirePermission('learning:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    return learningService.updateProgress(auth.org, id, body.status as string, body.progress as number | undefined, body.score as number | undefined);
  });
}
