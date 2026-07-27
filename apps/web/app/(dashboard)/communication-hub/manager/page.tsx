'use client';

import { Users } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useInbox, useConversations, useBroadcasts, useEmergencyAlerts } from '@/modules/communication-hub/store.js';

export default function ManagerDashboardPage() {
  const { data: inbox } = useInbox();
  const { data: conversations } = useConversations();
  const { data: broadcasts } = useBroadcasts();
  const { data: emergencyAlerts } = useEmergencyAlerts();

  const unreadCount = inbox?.messages?.filter((m) => !m.readAt).length ?? 0;
  const activeEmergencies = emergencyAlerts?.filter((e) => e.isActive).length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Communication overview and pending actions</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Unread Messages</p>
          <p className="text-2xl font-bold">{unreadCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Active Conversations</p>
          <p className="text-2xl font-bold">{conversations?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Broadcasts Sent</p>
          <p className="text-2xl font-bold">{broadcasts?.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Pending Acknowledgements</p>
          <p className="text-2xl font-bold text-red-600">{activeEmergencies}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Communication Trends</h2>
        <p className="text-sm text-[rgb(var(--muted))]">Trend data and AI insights will appear here as communication volume grows.</p>
      </Card>
    </div>
  );
}
