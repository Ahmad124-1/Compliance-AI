import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authenticate, getAuth, requirePermission } from './guard.js';
import { calendarService } from '../modules/calendar/index.js';

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  allDay: z.boolean().optional(),
  timezone: z.string().optional(),
  recurrenceRule: z.string().optional(),
  scope: z.record(z.any()).optional(),
  reminderMinutes: z.array(z.number()).optional(),
  channels: z.array(z.string()).optional(),
});

const rsvpSchema = z.object({
  status: z.enum(['accepted', 'declined', 'tentative']),
});

export async function calendarRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate);

  app.post('/calendar/events', { preHandler: requirePermission('calendar:create'), schema: { body: createEventSchema } }, async (req) => {
    const auth = getAuth(req);
    const body = req.body as z.infer<typeof createEventSchema>;
    return calendarService.createEvent(auth.org, { ...body, createdById: auth.sub });
  });

  app.get('/calendar/events', { preHandler: requirePermission('calendar:read') }, async (req) => {
    const auth = getAuth(req);
    const q = req.query as { eventType?: string; dateFrom?: string; dateTo?: string; limit?: string; offset?: string };
    return calendarService.listEvents(auth.org, {
      eventType: q.eventType,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
      limit: q.limit ? parseInt(q.limit, 10) : undefined,
      offset: q.offset ? parseInt(q.offset, 10) : undefined,
    });
  });

  app.get('/calendar/events/:id', { preHandler: requirePermission('calendar:read') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return calendarService.getEvent(auth.org, id);
  });

  const updateEventSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
  });

  app.patch('/calendar/events/:id', { preHandler: requirePermission('calendar:update'), schema: { body: updateEventSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof updateEventSchema>;
    return calendarService.updateEvent(auth.org, id, body);
  });

  app.post('/calendar/events/:id/rsvp', { preHandler: requirePermission('calendar:read'), schema: { body: rsvpSchema } }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    const body = req.body as z.infer<typeof rsvpSchema>;
    return calendarService.rsvp(auth.org, id, auth.sub, body.status);
  });

  app.post('/calendar/events/:id/checkin', { preHandler: requirePermission('calendar:read') }, async (req) => {
    const { id } = req.params as { id: string };
    return calendarService.checkIn('', id, id);
  });

  app.delete('/calendar/events/:id', { preHandler: requirePermission('calendar:delete') }, async (req) => {
    const auth = getAuth(req);
    const { id } = req.params as { id: string };
    return calendarService.deleteEvent(auth.org, id);
  });
}
