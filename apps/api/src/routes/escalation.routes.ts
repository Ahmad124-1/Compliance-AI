import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { escalationEngineService } from '../services/escalation-engine.service.js';
import { getEscalationHistory } from '../services/escalation.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const levelSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().positive(),
  description: z.string().optional(),
  roleId: z.string().uuid().nullable().optional(),
  notifyRoles: z.array(z.string().uuid()).optional(),
  autoEscalateAfterMinutes: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

const ruleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  conditionType: z.string().min(1),
  conditionValue: z.string().min(1),
  conditionOperator: z.string().optional(),
  escalateToLevelId: z.string().uuid().nullable().optional(),
  escalateToRoleId: z.string().uuid().nullable().optional(),
  escalateToUserId: z.string().uuid().nullable().optional(),
  notificationChannels: z.array(z.string()).optional(),
  autoEscalate: z.boolean().optional(),
  autoEscalateAfterMinutes: z.number().int().positive().nullable().optional(),
  requireApproval: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function escalationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // ---- Levels ----
  app.get('/escalation/levels', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const auth = getAuth(req);
    return escalationEngineService.listLevels(auth.org);
  });

  app.post('/escalation/levels', { preHandler: requirePermission('escalation:create'), schema: { body: levelSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof levelSchema>;
    return escalationEngineService.createLevel({ organizationId: auth.org, ...body }, auth.sub);
  });

  app.get('/escalation/levels/:id', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return escalationEngineService.getLevel(auth.org, id);
  });

  app.patch('/escalation/levels/:id', { preHandler: requirePermission('escalation:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return escalationEngineService.updateLevel(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/escalation/levels/:id', { preHandler: requirePermission('escalation:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await escalationEngineService.deleteLevel(auth.org, id);
    return { success: true };
  });

  // ---- Rules ----
  app.get('/escalation/rules', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const auth = getAuth(req);
    return escalationEngineService.listRules(auth.org);
  });

  app.post('/escalation/rules', { preHandler: requirePermission('escalation:create'), schema: { body: ruleSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof ruleSchema>;
    return escalationEngineService.createRule({ organizationId: auth.org, ...body }, auth.sub);
  });

  app.get('/escalation/rules/:id', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return escalationEngineService.getRule(auth.org, id);
  });

  app.patch('/escalation/rules/:id', { preHandler: requirePermission('escalation:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return escalationEngineService.updateRule(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.delete('/escalation/rules/:id', { preHandler: requirePermission('escalation:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await escalationEngineService.deleteRule(auth.org, id);
    return { success: true };
  });

  app.post('/escalation/rules/:id/evaluate', { preHandler: requirePermission('escalation:update') }, async (req) => {
    const { caseId } = req.body as { caseId: string };
    return escalationEngineService.evaluateRules(caseId);
  });

  app.get('/escalation/pending', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const auth = getAuth(req);
    return escalationEngineService.getPendingEscalations(auth.org);
  });

  // ---- Manual escalation (case-scoped) ----
  app.post('/escalation/cases/:caseId/escalate', { preHandler: requirePermission('escalation:create') }, async (req) => {
    const auth = getAuth(req);
    const { caseId } = req.params as { caseId: string };
    const body = req.body as { ruleId?: string | null; escalatedTo?: string | null; reason: string };
    return escalationEngineService.manualEscalate(caseId, body.ruleId ?? null, body.escalatedTo ?? null, body.reason, auth.sub);
  });

  app.get('/escalation/cases/:caseId/history', { preHandler: requirePermission('escalation:read') }, async (req) => {
    const { caseId } = req.params as { caseId: string };
    return getEscalationHistory(caseId);
  });
}
