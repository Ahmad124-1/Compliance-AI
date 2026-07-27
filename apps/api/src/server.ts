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
import { seedKnowledgeBase } from './modules/ai/knowledge/seed.js';
import { aiJobWorker } from './modules/ai/engine/jobs.queue.js';

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
import { aiFoundationRoutes } from './routes/ai-foundation.routes.js';
import { securityRoutes } from './routes/security.routes.js';
import { assessmentRoutes } from './routes/assessment.routes.js';
import { auditExecutionRoutes } from './routes/audit-execution.routes.js';
import { registerCAPARoutes } from './routes/capa.routes.js';
import { reportRoutes } from './routes/report.routes.js';
import { aiCopilotRoutes } from './routes/ai-copilot.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { documentAiRoutes } from './routes/document-ai.routes.js';
import { policyGeneratorRoutes } from './routes/policy-generator.routes.js';
import { clauseEngineRoutes } from './routes/clause-engine.routes.js';
import { aiAuditRoutes } from './routes/ai-audit.routes.js';
import { predictiveRoutes } from './routes/predictive.routes.js';
import { autonomousRoutes } from './routes/autonomous.routes.js';
import { workerPlatformRoutes } from './routes/worker-platform.routes.js';
import { workerVoiceRoutes } from './routes/worker-voice.routes.js';
import { workerAiRoutes } from './routes/worker-ai.routes.js';
import { engagementRoutes } from './routes/engagement.routes.js';
import { broadcastRoutes } from './routes/broadcast.routes.js';
import { messagingRoutes } from './routes/messaging.routes.js';
import { emergencyRoutes } from './routes/emergency.routes.js';
import { calendarRoutes } from './routes/calendar.routes.js';
import { channelManagerRoutes } from './routes/channel-manager.routes.js';
import { sustainabilityRoutes } from './routes/sustainability.routes.js';
import { carbonRoutes } from './routes/carbon.routes.js';
import { environmentRoutes } from './routes/environment.routes.js';
import { esgRoutes } from './routes/esg.routes.js';
import { supplierRoutes } from './routes/suppliers.routes.js';
import { supplierEsgRoutes } from './routes/supplier-esg.routes.js';
import { supplierRiskRoutes } from './routes/supplier-risk.routes.js';
import { supplierAuditRoutes } from './routes/supplier-audits.routes.js';
import { supplierScorecardRoutes } from './routes/supplier-scorecards.routes.js';
import { responsibleSourcingRoutes } from './routes/responsible-sourcing.routes.js';
import { certificationRoutes } from './routes/certifications.routes.js';

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

  // Sprint5A: AI Foundation & Compliance Knowledge Engine
  await app.register(aiFoundationRoutes, { prefix: '/api/v1' });

  // Legacy AI insight routes (complaint analysis / translation) — retained for compatibility.
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

  // Sprint 5C: AI Compliance Copilot
  await app.register(aiCopilotRoutes, { prefix: '/api/v1' });
  await app.register(chatRoutes, { prefix: '/api/v1' });
  await app.register(documentAiRoutes, { prefix: '/api/v1' });
  await app.register(policyGeneratorRoutes, { prefix: '/api/v1' });
  await app.register(clauseEngineRoutes, { prefix: '/api/v1' });

  // Sprint 5B: AI Audit Assistant
  await app.register(aiAuditRoutes, { prefix: '/api/v1' });

  // Sprint 5D: Predictive Intelligence Engine
  await app.register(predictiveRoutes, { prefix: '/api/v1' });

  // Sprint 5E: Autonomous Compliance Engine
  await app.register(autonomousRoutes, { prefix: '/api/v1' });

  // Sprint 6A: Worker Experience Platform
  await app.register(workerPlatformRoutes, { prefix: '/api/v1' });

  // Sprint 6B: Worker Voice & Ethics Platform
  await app.register(workerVoiceRoutes, { prefix: '/api/v1' });

  // Sprint 6C: AI Worker Assistant
  await app.register(workerAiRoutes, { prefix: '/api/v1' });

  // Sprint 6D: Worker Engagement & Wellbeing
  await app.register(engagementRoutes, { prefix: '/api/v1' });

  // Sprint 6E: Enterprise Communication & Collaboration Hub
  await app.register(broadcastRoutes, { prefix: '/api/v1' });
  await app.register(messagingRoutes, { prefix: '/api/v1' });
  await app.register(emergencyRoutes, { prefix: '/api/v1' });
  await app.register(calendarRoutes, { prefix: '/api/v1' });
  await app.register(channelManagerRoutes, { prefix: '/api/v1' });

  // Sprint 7A: Sustainability Management Platform
  await app.register(sustainabilityRoutes, { prefix: '/api/v1' });

  // Sprint 7B: Carbon & GHG Accounting Platform
  await app.register(carbonRoutes, { prefix: '/api/v1' });

  // Sprint 7C: Environmental Management System
  await app.register(environmentRoutes, { prefix: '/api/v1' });

  // Sprint 8A: Enterprise ESG Reporting & Disclosure
  await app.register(esgRoutes, { prefix: '/api/v1' });

  // Sprint 7E: Enterprise Supply Chain & Supplier ESG Platform
  await app.register(supplierRoutes, { prefix: '/api/v1' });
  await app.register(supplierEsgRoutes, { prefix: '/api/v1' });
  await app.register(supplierRiskRoutes, { prefix: '/api/v1' });
  await app.register(supplierAuditRoutes, { prefix: '/api/v1' });
  await app.register(supplierScorecardRoutes, { prefix: '/api/v1' });
  await app.register(responsibleSourcingRoutes, { prefix: '/api/v1' });
  await app.register(certificationRoutes, { prefix: '/api/v1' });

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
    await seedKnowledgeBase();
    aiJobWorker.start();
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
