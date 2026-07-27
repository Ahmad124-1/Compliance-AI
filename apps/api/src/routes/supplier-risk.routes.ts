import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { supplierRiskService } from '../services/supplier-risk.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const riskCreateSchema = z.object({
  supplierId: z.string().uuid(),
  riskType: z.enum(['child_labour', 'forced_labour', 'modern_slavery', 'unsafe_working_conditions', 'environmental_violation', 'corruption', 'sanctions', 'conflict_minerals', 'illegal_waste_disposal', 'deforestation', 'country_risk', 'political_risk', 'climate_risk']),
  title: z.string().min(1),
  description: z.string().optional(),
  likelihood: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  impact: z.enum(['negligible', 'minor', 'moderate', 'major', 'severe']),
  mitigationPlan: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  ownerName: z.string().optional(),
  reviewSchedule: z.string().optional(),
});

const riskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  likelihood: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']).optional(),
  impact: z.enum(['negligible', 'minor', 'moderate', 'major', 'severe']).optional(),
  mitigationPlan: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  ownerName: z.string().optional(),
  reviewSchedule: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'mitigated', 'closed', 'escalated']).optional(),
});

export async function supplierRiskRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/suppliers/risks', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { supplierId?: string; riskType?: string; status?: string; severity?: string; limit?: string; offset?: string };
    const risks = await supplierRiskService.listRisks(auth.org, q.supplierId, { riskType: q.riskType, status: q.status, severity: q.severity });
    return { risks, total: risks.length };
  });

  app.get('/suppliers/risks/heatmap', { preHandler: requirePermission('suppliers:read') }, async (req) => {
    const auth = getAuth(req);
    return supplierRiskService.getRiskHeatmap(auth.org);
  });

  app.get('/suppliers/risks/:id', { preHandler: requirePermission('suppliers:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierRiskService.getRisk(id, auth.org);
  });

  app.post('/suppliers/risks', { preHandler: requirePermission('suppliers:write'), schema: { body: riskCreateSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof riskCreateSchema>;
    return supplierRiskService.createRisk(auth.org, body.supplierId, body, auth.sub);
  });

  app.put('/suppliers/risks/:id', { preHandler: requirePermission('suppliers:write'), schema: { body: riskUpdateSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof riskUpdateSchema>;
    return supplierRiskService.updateRisk(id, auth.org, body, auth.sub);
  });

  app.post('/suppliers/risks/:id/close', { preHandler: requirePermission('suppliers:write') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return supplierRiskService.closeRisk(id, auth.org, auth.sub);
  });

  app.delete('/suppliers/risks/:id', { preHandler: requirePermission('suppliers:delete') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await supplierRiskService.closeRisk(id, auth.org, auth.sub);
    return { success: true };
  });
}