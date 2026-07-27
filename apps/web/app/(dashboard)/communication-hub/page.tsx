'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Bell, Siren, Calendar, BarChart3, Users, Send, AlertTriangle, Inbox } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useCommunicationHubUiStore, useInbox, useConversations, useBroadcasts, useEmergencyAlerts, useCalendarEvents, useCommunicationAnalytics } from '@/modules/communication-hub/store.js';
import { COMMUNICATION_ROUTES, COMMUNICATION_ICONS, BROADCAST_TYPES, EMERGENCY_TYPES } from '@/modules/communication-hub/constants.js';

const TABS = [
  { id: 'overview', label: 'Overview', icon: MessageSquare },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'broadcasts', label: 'Broadcasts', icon: Bell },
  { id: 'emergency', label: 'Emergency', icon: Siren },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'manager', label: 'Manager', icon: Users },
] as const;

export default function CommunicationHubPage() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useCommunicationHubUiStore();
  const { data: inbox } = useInbox();
  const { data: conversations } = useConversations();
  const { data: broadcasts } = useBroadcasts();
  const { data: emergencyAlerts } = useEmergencyAlerts();
  const { data: events } = useCalendarEvents();
  const { data: analytics } = useCommunicationAnalytics();

  const unreadCount = inbox?.messages?.filter((m) => !m.readAt).length ?? 0;
  const activeEmergencies = emergencyAlerts?.filter((e) => e.isActive).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Communication Hub</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Unified enterprise messaging, announcements, and collaboration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('inbox')}>
          <p className="text-xs text-[rgb(var(--muted))]">Unread Messages</p>
          <p className="text-2xl font-bold">{unreadCount}</p>
        </Card>
        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('chat')}>
          <p className="text-xs text-[rgb(var(--muted))]">Conversations</p>
          <p className="text-2xl font-bold">{conversations?.length ?? 0}</p>
        </Card>
        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('broadcasts')}>
          <p className="text-xs text-[rgb(var(--muted))]">Broadcasts</p>
          <p className="text-2xl font-bold">{broadcasts?.length ?? 0}</p>
        </Card>
        <Card className="p-4 cursor-pointer" onClick={() => setActiveTab('emergency')}>
          <p className="text-xs text-[rgb(var(--muted))]">Active Emergencies</p>
          <p className="text-2xl font-bold text-red-600">{activeEmergencies}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== 'overview') {
                  router.push(COMMUNICATION_ROUTES[tab.id as keyof typeof COMMUNICATION_ROUTES]);
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Messages</h2>
            <div className="space-y-3">
              {(inbox?.messages ?? []).slice(0, 5).map((msg) => (
                <div key={msg.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-3">
                  <div>
                    <p className="text-sm font-medium">{msg.subject ?? 'Message'}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                  {!msg.readAt && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
              ))}
              {(!inbox?.messages || inbox.messages.length === 0) && (
                <p className="text-sm text-[rgb(var(--muted))]">No messages yet</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Recent Broadcasts</h2>
            <div className="space-y-3">
              {(broadcasts ?? []).slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-3">
                  <div>
                    <p className="text-sm font-medium">{b.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{b.broadcastType} • {new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                  {b.pinned && <span className="text-xs text-[rgb(var(--muted))]">Pinned</span>}
                </div>
              ))}
              {(!broadcasts || broadcasts.length === 0) && (
                <p className="text-sm text-[rgb(var(--muted))]">No broadcasts yet</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Upcoming Events</h2>
            <div className="space-y-3">
              {(events ?? []).slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-3">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.startAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!events || events.length === 0) && (
                <p className="text-sm text-[rgb(var(--muted))]">No upcoming events</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Analytics</h2>
            <div className="space-y-3">
              {analytics ? (
                <>
                  <div className="flex justify-between"><span className="text-sm">Message Delivery Rate</span><span className="text-sm font-semibold">{analytics.messageDeliveryRate}%</span></div>
                  <div className="flex justify-between"><span className="text-sm">Read Rate</span><span className="text-sm font-semibold">{analytics.readRate}%</span></div>
                  <div className="flex justify-between"><span className="text-sm">Acknowledgement Rate</span><span className="text-sm font-semibold">{analytics.acknowledgementRate}%</span></div>
                  <div className="flex justify-between"><span className="text-sm">Engagement Score</span><span className="text-sm font-semibold">{analytics.engagementScore}%</span></div>
                </>
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">Loading analytics...</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
