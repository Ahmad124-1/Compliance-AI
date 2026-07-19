import type { FastifyInstance } from 'fastify';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { capaService } from '../modules/capa/services/capa.service.js';

export async function registerCAPARoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const read = requirePermission('capa:read');
  const create = requirePermission('capa:create');
  const update = requirePermission('capa:update');

  app.get('/capa/findings', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return capaService.listFindings(auth.org);
  });

  app.post('/capa/findings', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return capaService.createFinding(auth.org, body, auth.sub);
  });

  app.get('/capa/non-conformities', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return capaService.listNonConformities(auth.org);
  });

  app.post('/capa/non-conformities', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return capaService.createNonConformity(auth.org, body, auth.sub);
  });

  app.get('/capa', { preHandler: read }, async (req) => {
    const auth = getAuth(req);
    return capaService.listCAPAs(auth.org);
  });

  app.post('/capa', { preHandler: create }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as any;
    return capaService.createCAPA(auth.org, body, auth.sub);
  });

  app.post('/capa/:id/tasks', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    return capaService.createTask(id, body, getAuth(req).sub);
  });

  app.post('/capa/:id/root-causes', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    return capaService.createRootCause(id, body, getAuth(req).sub);
  });

  app.post('/capa/:id/risk-assessments', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    return capaService.createRiskAssessment(id, body, getAuth(req).sub);
  });

  app.post('/capa/:id/verification-checklists', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    return capaService.createVerificationChecklist(id, body, getAuth(req).sub);
  });

  app.post('/capa/:id/approvals', { preHandler: create }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as any;
    return capaService.createApproval(id, body, getAuth(req).sub);
  });
}
