import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { slaService } from '../services/sla.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const definitionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slaType: z.string().min(1),
  priority: z.string().min(1),
  severity: z.string().optional(),
  category: z.string().optional(),
  targetDurationMinutes: z.number().int().positive(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const instanceSchema = z.object({
  caseId: z.string().uuid(),
  slaDefinitionId: z.string().uuid(),
  slaType: z.string().min(1),
  deadline: z.string().datetime(),
});

const workingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  isActive: z.boolean().optional(),
});

const holidaySchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  isRecurring: z.boolean().optional(),
});

export async function slaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Definitions ----
  app.get('/sla/definitions', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    return slaService.listDefinitions(auth.org);
  });

  app.post('/sla/definitions', { preHandler: requirePermission('sla:create'), schema: { body: definitionSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof definitionSchema>;
    return slaService.createDefinition({ organizationId: auth.org, ...body }, auth.sub);
  });

  app.get('/sla/definitions/:id', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return slaService.getDefinition(auth.org, id);
  });

  app.patch('/sla/definitions/:id', { preHandler: requirePermission('sla:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return slaService.updateDefinition(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/sla/definitions/:id', { preHandler: requirePermission('sla:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await slaService.deleteDefinition(auth.org, id);
    return { success: true };
  });

  // ---- Instances ----
  app.get('/sla/instances', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.query as { caseId?: string };
    if (caseId) return slaService.listInstancesByCase(auth.org, caseId);
    const { slaInstanceRepo } = await import('../repositories/sla-instance.repo.js');
    return slaInstanceRepo.findByOrganization(auth.org);
  });

  app.post('/sla/instances', { preHandler: requirePermission('sla:create'), schema: { body: instanceSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof instanceSchema>;
    return slaService.createInstance({
      organizationId: auth.org,
      caseId: body.caseId,
      slaDefinitionId: body.slaDefinitionId,
      slaType: body.slaType,
      deadline: new Date(body.deadline),
    });
  });

  app.get('/sla/instances/:id', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return slaService.getInstance(auth.org, id);
  });

  app.post('/sla/instances/:id/pause', { preHandler: requirePermission('sla:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason: string };
    return slaService.pauseInstance(auth.org, id, reason);
  });

  app.post('/sla/instances/:id/resume', { preHandler: requirePermission('sla:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return slaService.resumeInstance(auth.org, id);
  });

  // ---- Working hours ----
  app.get('/sla/working-hours', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    return slaService.getWorkingHours(auth.org);
  });

  app.post('/sla/working-hours', { preHandler: requirePermission('sla:update'), schema: { body: workingHoursSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof workingHoursSchema>;
    return slaService.setWorkingHours(auth.org, body.dayOfWeek, body.startTime, body.endTime);
  });

  // ---- Holiday calendar ----
  app.get('/sla/holiday-calendars', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    return slaService.listHolidays(auth.org);
  });

  app.post('/sla/holiday-calendars', { preHandler: requirePermission('sla:create'), schema: { body: holidaySchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof holidaySchema>;
    return slaService.addHoliday(auth.org, body.name, body.date, body.isRecurring ?? false);
  });

  app.delete('/sla/holiday-calendars/:id', { preHandler: requirePermission('sla:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await slaService.deleteHoliday(auth.org, id);
    return { success: true };
  });

  app.get('/sla/stats', { preHandler: requirePermission('sla:read') }, async (req) => {
    const auth = getAuth(req);
    return slaService.getSlaStats(auth.org);
  });
}
