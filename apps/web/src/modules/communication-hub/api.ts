import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import type {
  CommunicationHubMessage,
  CommunicationHubConversation,
  Broadcast,
  BroadcastRecipient,
  EmergencyAlert,
  EmergencyAcknowledgement,
  CalendarEvent,
  EventAttendee,
  CommunicationAnalytics,
} from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const communicationHubApi = {
  listConversations: () => http<CommunicationHubConversation[]>('/api/v1/chat/conversations'),
  getConversation: (id: string) => http<CommunicationHubConversation>(`/api/v1/chat/conversations/${id}`),
  createConversation: (data: { title: string; type?: string; category?: string; participantIds?: string[] }) =>
    http<CommunicationHubConversation>('/api/v1/chat/conversations', { method: 'POST', body: JSON.stringify(data) }),
  archiveConversation: (id: string) => http<{ success: boolean }>(`/api/v1/chat/conversations/${id}/archive`, { method: 'POST' }),

  getInbox: () => http<{ messages: CommunicationHubMessage[]; conversations: any[] }>('/api/v1/chat/inbox'),

  listMessages: (params?: { conversationId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.conversationId) qs.set('conversationId', params.conversationId);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<CommunicationHubMessage[]>(`/api/v1/messages${suffix}`);
  },

  listBroadcasts: (params?: { broadcastType?: string; priority?: string }) => {
    const qs = new URLSearchParams();
    if (params?.broadcastType) qs.set('broadcastType', params.broadcastType);
    if (params?.priority) qs.set('priority', params.priority);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<(Broadcast & { recipients: Broadcast[] })[]>('/api/v1/broadcasts' + suffix);
  },
  getBroadcast: (id: string) => http<Broadcast & { recipients: Broadcast[] }>(`/api/v1/broadcasts/${id}`),
  createBroadcast: (data: Record<string, unknown>) => http<Broadcast>('/api/v1/broadcasts', { method: 'POST', body: JSON.stringify(data) }),
  sendBroadcast: (id: string, recipientIds: string[], channel?: string) =>
    http<Broadcast>(`/api/v1/broadcasts/${id}/send`, { method: 'POST', body: JSON.stringify({ recipientIds, channel }) }),
  acknowledgeBroadcast: (id: string) => http<BroadcastRecipient>(`/api/v1/broadcasts/${id}/acknowledge`, { method: 'POST' }),
  markBroadcastRead: (id: string) => http<BroadcastRecipient>(`/api/v1/broadcasts/${id}/read`, { method: 'POST' }),

  listEmergencyAlerts: (params?: { alertType?: string; isActive?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.alertType) qs.set('alertType', params.alertType);
    if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<EmergencyAlert[]>('/api/v1/emergency' + suffix);
  },
  getEmergencyAlert: (id: string) => http<(EmergencyAlert & { acknowledgements: EmergencyAcknowledgement[] })>(`/api/v1/emergency/${id}`),
  createEmergencyAlert: (data: Record<string, unknown>) => http<EmergencyAlert>('/api/v1/emergency', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeEmergency: (id: string, data: { status?: string; note?: string; location?: Record<string, unknown> }) =>
    http<EmergencyAcknowledgement>(`/api/v1/emergency/${id}/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),
  deactivateEmergency: (id: string) => http<EmergencyAlert>(`/api/v1/emergency/${id}/deactivate`, { method: 'POST' }),

  listCalendarEvents: (params?: { eventType?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams();
    if (params?.eventType) qs.set('eventType', params.eventType);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const suffix = qs.toString() ? `?${qs}` : '';
    return http<CalendarEvent[]>('/api/v1/calendar/events' + suffix);
  },
  getCalendarEvent: (id: string) => http<(CalendarEvent & { attendees: EventAttendee[] })>(`/api/v1/calendar/events/${id}`),
  createCalendarEvent: (data: Record<string, unknown>) => http<CalendarEvent>('/api/v1/calendar/events', { method: 'POST', body: JSON.stringify(data) }),
  rsvpEvent: (id: string, status: 'accepted' | 'declined' | 'tentative') =>
    http<EventAttendee>(`/api/v1/calendar/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),

  getAnalytics: () => http<CommunicationAnalytics>('/api/v1/engagement/dashboard'),
};
