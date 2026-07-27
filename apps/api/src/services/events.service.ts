import { NotFoundError } from '../core/errors.js';
import { audit } from '../core/audit.js';
import { organizationRepo } from '../repositories/organization.repo.js';
import { eventRepo } from '../repositories/event.repo.js';
import { notificationService } from '../services/notification.service.js';

export const eventsService = {
  async list(orgId: string, filters: { eventType?: string; status?: string; siteId?: string; departmentId?: string; dateFrom?: string; dateTo?: string } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return eventRepo.findMany(orgId, filters);
  },

  async get(orgId: string, id: string) {
    const event = await eventRepo.findById(orgId, id);
    if (!event) throw new NotFoundError('Event not found');
    const stats = await eventRepo.getStats(orgId, id);
    return { ...event, stats };
  },

  async create(orgId: string, userId: string, input: any) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const event = await eventRepo.create({ organizationId: orgId, organizerId: userId, ...input });
    await notificationService.createNotification({
      organizationId: orgId,
      userId: userId,
      type: 'assignment',
      channel: 'in_app',
      title: 'New Event Created',
      body: `Event "${event.title}" has been scheduled.`,
      data: { eventId: event.id },
    });
    await audit({ organizationId: orgId, actorId: userId, action: 'event.create', entity: 'event', entityId: event.id });
    return event;
  },

  async update(orgId: string, id: string, userId: string, patch: any) {
    const event = await eventRepo.findById(orgId, id);
    if (!event) throw new NotFoundError('Event not found');
    const updated = await eventRepo.update(orgId, id, patch);
    if (!updated) throw new NotFoundError('Event update failed');
    await audit({ organizationId: orgId, actorId: userId, action: 'event.update', entity: 'event', entityId: id });
    return updated;
  },

  async register(orgId: string, eventId: string, userId: string, rsvpStatus = 'accepted') {
    const event = await eventRepo.findById(orgId, eventId);
    if (!event) throw new NotFoundError('Event not found');
    const attendance = await eventRepo.upsertAttendance({ organizationId: orgId, eventId, userId, status: 'registered', rsvpStatus });
    await audit({ organizationId: orgId, actorId: userId, action: 'event.register', entity: 'event_attendance', entityId: attendance.id });
    return attendance;
  },

  async signIn(orgId: string, eventId: string, userId: string) {
    const event = await eventRepo.findById(orgId, eventId);
    if (!event) throw new NotFoundError('Event not found');
    const attendance = await eventRepo.signIn(orgId, eventId, userId) || (await eventRepo.findAttendance(orgId, eventId, userId))[0];
    await audit({ organizationId: orgId, actorId: userId, action: 'event.sign_in', entity: 'event_attendance', entityId: attendance?.id });
    return attendance;
  },

  async signOut(orgId: string, eventId: string, userId: string) {
    const event = await eventRepo.findById(orgId, eventId);
    if (!event) throw new NotFoundError('Event not found');
    const attendance = await eventRepo.signOut(orgId, eventId, userId) || (await eventRepo.findAttendance(orgId, eventId, userId))[0];
    await audit({ organizationId: orgId, actorId: userId, action: 'event.sign_out', entity: 'event_attendance', entityId: attendance?.id });
    return attendance;
  },

  async getAttendance(orgId: string, eventId: string) {
    const event = await eventRepo.findById(orgId, eventId);
    if (!event) throw new NotFoundError('Event not found');
    return eventRepo.findAttendance(orgId, eventId);
  },

  async getStats(orgId: string, eventId: string) {
    const event = await eventRepo.findById(orgId, eventId);
    if (!event) throw new NotFoundError('Event not found');
    return eventRepo.getStats(orgId, eventId);
  },
};
