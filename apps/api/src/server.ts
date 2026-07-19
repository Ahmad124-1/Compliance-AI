import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';

import { env } from './config/env.js';
import { errorHandler } from './core/errors.js';
import { TokenService } from './core/tokens.js';
import { pool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { rbacService } from './services/rbac.service.js';
import { seedStandards } from './db/seed-standards.js';

import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { organizationRoutes } from './routes/organization.routes.js';
import { tenantRoutes } from './routes/tenant.routes.js';
import { rbacRoutes } from './routes/rbac.routes.js';
import { standardsRoutes } from './routes/standards.routes.js';
import { publicRoutes } from './routes/public.routes.js';
import { adminGrievanceRoutes } from './routes/admin.routes.js';
import { caseRoutes } from './routes/case.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { slaRoutes } from './routes/sla.routes.js';
import { escalationRoutes } from './routes/escalation.routes.js';
import { qrRoutes, publicQrRoutes } from './routes/qr.routes.js';
import { templateRoutes } from './routes/template.routes.js';
import { analyticsRoutes } from './routes/analytics.routes.js';
import { communicationSettingsRoutes } from './routes/communication-settings.routes.js';
import { workerCommunicationRoutes } from './routes/worker-communication.routes.js';
import { queueRoutes } from './routes/queue.routes.js';
import { searchRoutes } from './routes/search.routes.js';
import { auditRoutes } from './routes/audit.routes.js';
import { aiRoutes } from './routes/ai.routes.js';
import { securityRoutes } from './routes/security.routes.js';
import { assessmentRoutes } from './routes/assessment.routes.js';
import { auditExecutionRoutes } from './routes/audit-execution.routes.js';
import { registerCAPARoutes } from './routes/capa.routes.js';
import { reportRoutes } from './routes/report.routes.js';

declare module 'fastify' {
  interface FastifyInstance {
    tokenService: TokenService;
  }
}

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(jwt, { secret: env.JWT_SECRET });

  app.tokenService = new TokenService(app);

  app.setErrorHandler(errorHandler);

  // Health (public)
  app.get('/health', async () => ({ status: 'ok' }));

  // Auth (public) under /api/v1/auth
  await app.register(authRoutes, { prefix: '/api/v1/auth' });

  // Public resources
  await app.register(publicRoutes, { prefix: '/api/v1' });

  // Protected resources
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(organizationRoutes, { prefix: '/api/v1/organizations' });
  await app.register(tenantRoutes, { prefix: '/api/v1/tenants' });
  await app.register(rbacRoutes, { prefix: '/api/v1/rbac' });
  await app.register(standardsRoutes, { prefix: '/api/v1/standards' });
  await app.register(adminGrievanceRoutes, { prefix: '/api/v1/admin' });
  await app.register(caseRoutes, { prefix: '/api/v1/cases' });

  // Sprint 3C modules
  await app.register(notificationRoutes, { prefix: '/api/v1' });
  await app.register(slaRoutes, { prefix: '/api/v1' });
  await app.register(escalationRoutes, { prefix: '/api/v1' });
  await app.register(qrRoutes, { prefix: '/api/v1' });
  await app.register(templateRoutes, { prefix: '/api/v1' });
  await app.register(analyticsRoutes, { prefix: '/api/v1' });
  await app.register(communicationSettingsRoutes, { prefix: '/api/v1' });
  await app.register(workerCommunicationRoutes, { prefix: '/api/v1' });
  await app.register(queueRoutes, { prefix: '/api/v1' });

  // Sprint3D: AI Foundation (provider interfaces, no LLM calls)
  await app.register(aiRoutes, { prefix: '/api/v1' });

  // Sprint3D: Global Search + Saved/Recent searches
  await app.register(searchRoutes, { prefix: '/api/v1' });

  // Sprint3D: Audit Trail
  await app.register(auditRoutes, { prefix: '/api/v1' });

  // Sprint3D: Security review
  await app.register(securityRoutes, { prefix: '/api/v1' });

  // Sprint 4A: Assessment Framework Engine
  await app.register(assessmentRoutes, { prefix: '/api/v1' });

  // Sprint 4B: Audit Execution Workspace
  await app.register(auditExecutionRoutes, { prefix: '/api/v1' });

  // Sprint 4C: Findings, Non-Conformities, and CAPA
  await app.register(registerCAPARoutes, { prefix: '/api/v1' });

  // Sprint 4D: Reporting engine and exports
  await app.register(reportRoutes, { prefix: '/api/v1' });

  // Public QR lookup (no auth)
  await app.register(publicQrRoutes, { prefix: '/api/v1' });

  return app;
}

async function start(): Promise<void> {
  const app = await buildServer();
  try {
    await migrate();
    await rbacService.ensureSeeded();
    await seedStandards();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`[api] listening on ${env.HOST}:${env.PORT}`);
  } catch (err) {
    console.error('[api] startup failed', err);
    await pool.end();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
