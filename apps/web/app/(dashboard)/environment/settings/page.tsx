'use client';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import Link from 'next/link';
import { Brain, Sparkles, Leaf } from 'lucide-react';

export default function EnvironmentSettingsPage() {
  const { data } = useQuery({ queryKey: ['environment','dashboard'], queryFn: () => environmentService.getDashboard() });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Environmental Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">AI-powered insights and environmental configuration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/ai">
          <Card className="p-6 transition-colors hover:bg-[rgb(var(--panel-2))]">
            <Brain className="h-8 w-8 text-purple-500" />
            <h3 className="mt-3 font-medium">AI Environmental Copilot</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">Explain regulations, summarize incidents, predict risks, and generate corrective actions using AI.</p>
            <Button variant="outline" size="sm" className="mt-4">Open Copilot</Button>
          </Card>
        </Link>
        <Link href="/dashboard/environment">
          <Card className="p-6 transition-colors hover:bg-[rgb(var(--panel-2))]">
            <Leaf className="h-8 w-8 text-green-500" />
            <h3 className="mt-3 font-medium">Environmental Dashboard</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">View KPIs, water usage, waste, air emissions, incidents, and compliance status.</p>
            <Button variant="outline" size="sm" className="mt-4">View Dashboard</Button>
          </Card>
        </Link>
        <Link href="/reports">
          <Card className="p-6 transition-colors hover:bg-[rgb(var(--panel-2))]">
            <Sparkles className="h-8 w-8 text-blue-500" />
            <h3 className="mt-3 font-medium">Environmental Reports</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">Generate water, waste, air, chemical, and executive reports in PDF, Excel, or CSV.</p>
            <Button variant="outline" size="sm" className="mt-4">View Reports</Button>
          </Card>
        </Link>
      </div>
    </div>
  );
}
