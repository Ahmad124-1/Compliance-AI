import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { grievanceService, lookupService } from '../modules/grievances/services/grievance.service.js';
import { trackingService } from '../modules/grievances/services/tracking.service.js';

const complaintSchema = z.object({
  organizationId: z.string().uuid(),
  source: z.enum(['website', 'qr', 'email', 'sms', 'whatsapp', 'phone', 'walk-in', 'suggestion_box', 'ngo', 'union', 'government']).default('website'),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  language: z.string().min(2).max(5).default('en'),
  anonymous: z.boolean().default(true),
  reporterName: z.string().nullable().optional(),
  reporterEmail: z.string().email().nullable().optional(),
  reporterPhone: z.string().nullable().optional(),
  factory: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
});

const trackSchema = z.object({
  trackingNumber: z.string().min(1),
  trackingPIN: z.string().min(1),
});

export async function publicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/public/categories', async (req) => {
    const orgId = (req.query as { organizationId?: string })?.organizationId;
    const categories = await lookupService.categories(orgId);
    return categories;
  });

  app.get('/public/languages', async () => {
    const languages = await lookupService.languages();
    return languages;
  });

  app.get('/public/sources', async () => {
    const sources = await lookupService.sources();
    return sources;
  });

  app.get('/public/channels', async () => {
    const channels = await lookupService.channels();
    return channels;
  });

  app.post('/public/complaints', { schema: { body: complaintSchema } }, async (req) => {
    const body = req.body as z.infer<typeof complaintSchema>;
    const { trackingNumber, trackingPIN } = await trackingService.generate();
    const grievance = await grievanceService.create({ ...body, trackingNumber, trackingPIN });
    return { trackingNumber, trackingPIN, id: grievance.id };
  });

  app.post('/public/track', { schema: { body: trackSchema } }, async (req) => {
    const { trackingNumber, trackingPIN } = req.body as z.infer<typeof trackSchema>;
    const grievance = await grievanceService.findByTrackingAndPIN(trackingNumber, trackingPIN);
    if (!grievance) {
      return { found: false };
    }
    return {
      found: true,
      trackingNumber: grievance.trackingNumber,
      status: grievance.status,
      priority: grievance.priority,
      category: grievance.category,
      createdAt: grievance.createdAt,
      updatedAt: grievance.updatedAt,
    };
  });
}
