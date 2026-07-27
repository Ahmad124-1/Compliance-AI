import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from '../routes/guard.js';
import { automationService, workflowEngineService, actionQueueService, approvalEngineService, executionEngineService, orchestratorService } from '../modules/autonomous/index.js';

export async function autonomousRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  // Automation Rules
  app.post('/automation/rules', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    name: z.string().min(1), description: z.string().optional(), triggerType: z.string().min(1),
    triggerConditions: z.record(z.any()), actions: z.array(z.record(z.any())),
    requiresApproval: z.boolean().optional(), approvalRoles: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return automationService.createAutomationRule({ organizationId: auth.org, ...body, createdBy: auth.sub });
  });

  app.get('/automation/rules', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ triggerType: z.string().optional(), isActive: z.boolean().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return automationService.listAutomationRules(auth.org, q);
  });

  app.get('/automation/rules/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const rule = await automationService.getAutomationRule(id);
    if (!rule || rule.organizationId !== auth.org) throw new Error('Automation rule not found');
    return rule;
  });

  app.patch('/automation/rules/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const updated = await automationService.updateAutomationRule(id, { organizationId: auth.org, ...body, updatedBy: auth.sub });
    if (!updated) throw new Error('Automation rule not found');
    return updated;
  });

  app.delete('/automation/rules/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const deleted = await automationService.deleteAutomationRule(id, auth.org, auth.sub);
    if (!deleted) throw new Error('Automation rule not found');
    return { success: true };
  });

  // Workflow Definitions
  app.post('/workflows', { preHandler: requirePermission('ai:update'), schema: { body: z.object({
    name: z.string().min(1), description: z.string().optional(), category: z.string().min(1),
    steps: z.array(z.record(z.any())), variables: z.record(z.any()),
    isSystem: z.boolean().optional(), version: z.string().optional(), metadata: z.record(z.any()).optional(),
  }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return automationService.createWorkflowDefinition({ organizationId: auth.org, ...body, createdBy: auth.sub });
  });

  app.get('/workflows', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ category: z.string().optional(), isActive: z.boolean().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return automationService.listWorkflowDefinitions(auth.org, q);
  });

  app.get('/workflows/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const workflow = await automationService.getWorkflowDefinition(id);
    if (!workflow || workflow.organizationId !== auth.org) throw new Error('Workflow not found');
    return workflow;
  });

  app.patch('/workflows/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as any;
    const updated = await automationService.updateWorkflowDefinition(id, { organizationId: auth.org, ...body, updatedBy: auth.sub });
    if (!updated) throw new Error('Workflow not found');
    return updated;
  });

  app.delete('/workflows/:id', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const deleted = await automationService.deleteWorkflowDefinition(id, auth.org, auth.sub);
    if (!deleted) throw new Error('Workflow not found');
    return { success: true };
  });

  app.post('/workflows/:id/execute', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as { inputParams?: Record<string, unknown> };
    return workflowEngineService.executeWorkflow(id, auth.org, body.inputParams ?? {}, auth.sub);
  });

  // Action Queue
  app.get('/actions', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ status: z.string().optional(), priority: z.string().optional(), actionType: z.string().optional(), limit: z.coerce.number().int().optional(), offset: z.coerce.number().int().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return actionQueueService.list(auth.org, q);
  });

  app.get('/actions/:id', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const action = await actionQueueService.findById(id);
    if (!action || action.organizationId !== auth.org) throw new Error('Action not found');
    return action;
  });

  // Approvals
  app.post('/approval/:actionId/approve', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { actionId } = req.params as { actionId: string };
    const body = req.body as { decision?: string; comments?: string };
    return approvalEngineService.approveAction(actionId, auth.org, auth.sub, body.decision, body.comments);
  });

  app.post('/approval/:actionId/reject', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { actionId } = req.params as { actionId: string };
    const body = req.body as { reason?: string };
    return approvalEngineService.rejectAction(actionId, auth.org, auth.sub, body.reason);
  });

  app.post('/approval/:actionId/modify', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { actionId } = req.params as { actionId: string };
    const body = req.body as { modifications: Record<string, unknown>; comments?: string };
    return approvalEngineService.modifyAction(actionId, auth.org, auth.sub, body.modifications, body.comments);
  });

  app.get('/approval', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return approvalEngineService.getApprovals(auth.org, q);
  });

  // Execution
  app.post('/execution/:actionId/run', { preHandler: requirePermission('ai:update') }, async (req) => {
    const auth = getAuth(req);
    const { actionId } = req.params as { actionId: string };
    return executionEngineService.execute(actionId, auth.org, auth.sub);
  });

  app.get('/execution/logs', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ actionId: z.string().optional(), status: z.string().optional(), limit: z.coerce.number().int().optional(), offset: z.coerce.number().int().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return executionEngineService.getExecutionLogs(auth.org, q);
  });

  // History
  app.get('/history', { preHandler: requirePermission('ai:read'), schema: { querystring: z.object({ decisionType: z.string().optional(), isApproved: z.boolean().optional(), limit: z.coerce.number().int().optional(), offset: z.coerce.number().int().optional() }) } }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as any;
    return orchestratorService.getDecisionHistory(auth.org, q);
  });

  app.get('/stats', { preHandler: requirePermission('ai:read') }, async (req) => {
    const auth = getAuth(req);
    return orchestratorService.getAutomationStats(auth.org);
  });

  app.post('/run', { preHandler: requirePermission('ai:update'), schema: { body: z.object({ triggerType: z.string().min(1), context: z.record(z.any()) }) } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return orchestratorService.runAutomation(auth.org, body.triggerType, body.context, auth.sub);
  });
}
