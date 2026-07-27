import { NotFoundError } from '../../core/errors.js';
import { audit } from '../../core/audit.js';
import { organizationRepo } from '../../repositories/organization.repo.js';
import { calendarEventRepo } from '../../repositories/calendar-event.repo.js';
import { eventAttendeeRepo } from '../../repositories/calendar-event.repo.js';

export interface CalendarEventInput {
  title: string;
  description?: string;
  eventType?: string;
  priority?: string;
  location?: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  timezone?: string;
  recurrenceRule?: string;
  scope?: Record<string, unknown>;
  reminderMinutes?: number[];
  channels?: string[];
  createdById?: string;
}

export const calendarService = {
  async createEvent(orgId: string, input: CalendarEventInput) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    const rest = input;
    const event = await calendarEventRepo.create({ organizationId: orgId, ...rest });
    await audit({ organizationId: orgId, actorId: input.createdById ?? null, action: 'calendar_event.create', entity: 'calendar_event', entityId: event.id });
    return event;
  },

  async listEvents(orgId: string, filters: { eventType?: string; dateFrom?: string; dateTo?: string; limit?: number; offset?: number } = {}) {
    const org = await organizationRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');
    return calendarEventRepo.listByOrganization(orgId, filters);
  },

  async getEvent(orgId: string, id: string) {
    const event = await calendarEventRepo.findById(id);
    if (!event || event.organizationId !== orgId) throw new NotFoundError('Calendar event not found');
    const attendees = await eventAttendeeRepo.listByEvent(id);
    return { ...event, attendees };
  },

  async updateEvent(orgId: string, id: string, patch: Partial<{ title: string; description: string; startAt: string; endAt: string }>) {
    const event = await calendarEventRepo.findById(id);
    if (!event || event.organizationId !== orgId) throw new NotFoundError('Calendar event not found');
    const updated = await calendarEventRepo.update(id, patch);
    await audit({ organizationId: orgId, action: 'calendar_event.update', entity: 'calendar_event', entityId: id });
    return updated;
  },

  async rsvp(orgId: string, eventId: string, userId: string, status: 'accepted' | 'declined' | 'tentative') {
    const event = await calendarEventRepo.findById(eventId);
    if (!event || event.organizationId !== orgId) throw new NotFoundError('Calendar event not found');
    const attendance = await eventAttendeeRepo.create({ calendarEventId: eventId, organizationId: orgId, userId, status });
    await audit({ organizationId: orgId, actorId: userId, action: 'calendar_event.rsvp', entity: 'event_attendee', entityId: attendance.id });
    return attendance;
  },

  async checkIn(orgId: string, eventId: string, attendeeId: string) {
    const attendance = await eventAttendeeRepo.updateStatus(attendeeId, 'checked_in');
    await audit({ organizationId: orgId, action: 'calendar_event.checkin', entity: 'event_attendee', entityId: attendeeId });
    return attendance;
  },

  async deleteEvent(orgId: string, id: string) {
    const event = await calendarEventRepo.findById(id);
    if (!event || event.organizationId !== orgId) throw new NotFoundError('Calendar event not found');
    await calendarEventRepo.delete(id);
    await audit({ organizationId: orgId, action: 'calendar_event.delete', entity: 'calendar_event', entityId: id });
  },
};
