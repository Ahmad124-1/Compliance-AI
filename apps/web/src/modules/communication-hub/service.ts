import { communicationHubApi } from './api.js';

export const communicationHubService = {
  listConversations: () => communicationHubApi.listConversations(),
  getConversation: (id: string) => communicationHubApi.getConversation(id),
  createConversation: (data: { title: string; type?: string; category?: string; participantIds?: string[] }) => communicationHubApi.createConversation(data),
  archiveConversation: (id: string) => communicationHubApi.archiveConversation(id),

  getInbox: () => communicationHubApi.getInbox(),

  listMessages: (params?: { conversationId?: string; limit?: number }) => communicationHubApi.listMessages(params),

  listBroadcasts: (params?: { broadcastType?: string; priority?: string }) => communicationHubApi.listBroadcasts(params),
  getBroadcast: (id: string) => communicationHubApi.getBroadcast(id),
  createBroadcast: (data: Record<string, unknown>) => communicationHubApi.createBroadcast(data),
  sendBroadcast: (id: string, recipientIds: string[], channel?: string) => communicationHubApi.sendBroadcast(id, recipientIds, channel),
  acknowledgeBroadcast: (id: string) => communicationHubApi.acknowledgeBroadcast(id),
  markBroadcastRead: (id: string) => communicationHubApi.markBroadcastRead(id),

  listEmergencyAlerts: (params?: { alertType?: string; isActive?: boolean }) => communicationHubApi.listEmergencyAlerts(params),
  getEmergencyAlert: (id: string) => communicationHubApi.getEmergencyAlert(id),
  createEmergencyAlert: (data: Record<string, unknown>) => communicationHubApi.createEmergencyAlert(data),
  acknowledgeEmergency: (id: string, data: { status?: string; note?: string; location?: Record<string, unknown> }) => communicationHubApi.acknowledgeEmergency(id, data),
  deactivateEmergency: (id: string) => communicationHubApi.deactivateEmergency(id),

  listCalendarEvents: (params?: { eventType?: string; dateFrom?: string; dateTo?: string }) => communicationHubApi.listCalendarEvents(params),
  getCalendarEvent: (id: string) => communicationHubApi.getCalendarEvent(id),
  createCalendarEvent: (data: Record<string, unknown>) => communicationHubApi.createCalendarEvent(data),
  rsvpEvent: (id: string, status: 'accepted' | 'declined' | 'tentative') => communicationHubApi.rsvpEvent(id, status),

  getAnalytics: () => communicationHubApi.getAnalytics(),
};
