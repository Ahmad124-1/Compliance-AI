'use client';

import { BarChart3, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { useCommunicationAnalytics, useBroadcasts } from '@/modules/communication-hub/store.js';

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useCommunicationAnalytics();
  const { data: broadcasts } = useBroadcasts();

  const stats = [
    { label: 'Message Delivery Rate', value: `${analytics?.messageDeliveryRate ?? 0}%` },
    { label: 'Read Rate', value: `${analytics?.readRate ?? 0}%` },
    { label: 'Acknowledgement Rate', value: `${analytics?.acknowledgementRate ?? 0}%` },
    { label: 'Engagement Score', value: `${analytics?.engagementScore ?? 0}%` },
    { label: 'Communication Effectiveness', value: `${analytics?.communicationEffectiveness ?? 0}%` },
    { label: 'Emergency Response Time', value: `${analytics?.emergencyResponseTime ?? 0} min` },
  ];

  const langDist = analytics?.languageDistribution ?? {};
  const deptReach = analytics?.departmentReach ?? {};

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Communication Analytics</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Executive dashboard for communication effectiveness</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[rgb(var(--muted))]">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><TrendingUp className="h-4 w-4" /> Language Distribution</h2>
          <div className="space-y-2">
            {Object.entries(langDist).map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between">
                <span className="text-sm capitalize">{lang}</span>
                <span className="text-sm font-semibold">{String(count)}</span>
              </div>
            ))}
            {Object.keys(langDist).length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No data</p>}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-4 w-4" /> Department Reach</h2>
          <div className="space-y-2">
            {Object.entries(deptReach).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm capitalize">{dept}</span>
                <span className="text-sm font-semibold">{String(count)}</span>
              </div>
            ))}
            {Object.keys(deptReach).length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No data</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
