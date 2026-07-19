import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { qrService } from '../services/qr.service.js';
import { authenticate, getAuth, requirePermission } from './guard.js';

const qrSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  url: z.string().min(1),
  siteId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  configuration: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export async function qrRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.get('/qr-codes', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { type?: string; isActive?: string };
    return qrService.listQrCodes(auth.org, {
      type: q.type,
      isActive: q.isActive ? q.isActive === 'true' : undefined,
    });
  });

  app.get('/qr-codes/stats', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    return qrService.getQrStats(auth.org);
  });

  app.post('/qr-codes', { preHandler: requirePermission('qr:create'), schema: { body: qrSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof qrSchema>;
    return qrService.createQrCode(
      {
        organizationId: auth.org,
        name: body.name,
        type: body.type,
        url: body.url,
        siteId: body.siteId,
        departmentId: body.departmentId,
        configuration: body.configuration,
        isActive: body.isActive,
      },
      auth.sub,
    );
  });

  app.get('/qr-codes/:id', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return qrService.getQrCode(auth.org, id);
  });

  app.patch('/qr-codes/:id', { preHandler: requirePermission('qr:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return qrService.updateQrCode(auth.org, id, req.body as Record<string, unknown>, auth.sub);
  });

  app.post('/qr-codes/:id/regenerate', { preHandler: requirePermission('qr:update') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return qrService.regenerateQrCode(auth.org, id);
  });

  app.delete('/qr-codes/:id', { preHandler: requirePermission('qr:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    await qrService.deleteQrCode(auth.org, id);
    return { success: true };
  });

  app.get('/qr-codes/:id/analytics', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return qrService.getQrAnalytics(auth.org, id);
  });

  app.get('/qr-codes/:id/download', { preHandler: requirePermission('qr:read') }, async (req, reply) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const { format } = req.query as { format?: string };
    if (format === 'svg') {
      const svg = await qrService.downloadQrSvg(auth.org, id);
      reply.header('Content-Type', 'image/svg+xml');
      return svg;
    }
    const png = await qrService.downloadQrPng(auth.org, id);
    reply.header('Content-Type', 'image/png');
    return png;
  });

  app.post('/qr-codes/:id/scan', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as {
      ipAddress?: string;
      userAgent?: string;
      country?: string;
      city?: string;
      device?: string;
      browser?: string;
    };
    return qrService.recordScan(auth.org, id, body);
  });

  app.get('/qr-scans/analytics', { preHandler: requirePermission('qr:read') }, async (req) => {
    const auth = getAuth(req);
    return qrService.getQrAnalytics(auth.org);
  });
}

// Public QR lookup (no auth) used by portals.
export async function publicQrRoutes(app: FastifyInstance): Promise<void> {
  app.get('/qr/:code', async (req) => {
    const { code } = req.params as { code: string };
    const qr = await qrService.getQrCodeByCode(code);
    if (!qr) {
      const { NotFoundError } = await import('../core/errors.js');
      throw new NotFoundError('QR code not found');
    }
    return qr;
  });
}
