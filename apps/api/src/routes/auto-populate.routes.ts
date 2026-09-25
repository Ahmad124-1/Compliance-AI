import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, getAuth } from './guard.js';
import { autoPopulateService } from '../services/auto-populate.service.js';

const fillQuery = z.object({
  facilityId: z.string().uuid().optional().nullable(),
  programId: z.string().uuid().optional().nullable(),
  kpiId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  reportingPeriodId: z.string().uuid().optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
});

export async function autoPopulateRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auto-populate', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = fillQuery.parse(request.query ?? {});
    return reply.send(await autoPopulateService.getAutoFill(claims.org, q));
  });

  app.get('/auto-populate/calculations', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { facilityId?: string; programId?: string; projectId?: string };
    const [projects, goals, targets, kpis, reductions, emissions, suppliers, compliance, esg, evidence] = await Promise.all([
      autoPopulateService.getProjectProgress(claims.org, q.projectId ?? null),
      autoPopulateService.getGoalProgress(claims.org, q.programId ?? null),
      autoPopulateService.getTargetProgress(claims.org),
      autoPopulateService.getKpiStatuses(claims.org, q.programId ?? null),
      autoPopulateService.getCarbonReduction(claims.org, q.facilityId ?? null),
      autoPopulateService.getEmissionTotals(claims.org, q.facilityId ?? null),
      autoPopulateService.getSupplierContributions(claims.org),
      autoPopulateService.getCompliancePct(claims.org),
      autoPopulateService.getEsgProgress(claims.org, q.programId ?? null),
      autoPopulateService.getEvidenceCounts(claims.org),
    ]);
    return reply.send({ projects, goals, targets, kpis, reductions, emissions, suppliers, compliance, esg, evidence });
  });

  app.get('/auto-populate/reports/snapshot', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { reportId?: string };
    return reply.send(await autoPopulateService.getReportSnapshot(claims.org, q.reportId ?? null));
  });

  app.get('/auto-populate/project-progress', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { projectId?: string };
    return reply.send(await autoPopulateService.getProjectProgress(claims.org, q.projectId ?? null));
  });
  app.get('/auto-populate/goal-progress', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { programId?: string };
    return reply.send(await autoPopulateService.getGoalProgress(claims.org, q.programId ?? null));
  });
  app.get('/auto-populate/kpi-statuses', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { programId?: string };
    return reply.send(await autoPopulateService.getKpiStatuses(claims.org, q.programId ?? null));
  });
  app.get('/auto-populate/emission-totals', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    const q = request.query as { facilityId?: string };
    return reply.send(await autoPopulateService.getEmissionTotals(claims.org, q.facilityId ?? null));
  });
  app.get('/auto-populate/report-completion', { preHandler: [authenticate] }, async (request, reply) => {
    const claims = getAuth(request);
    return reply.send(await autoPopulateService.getReportCompletion(claims.org));
  });
}