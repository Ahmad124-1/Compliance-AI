'use client';

import Link from 'next/link';
import { Settings2 } from 'lucide-react';

import { Card } from '@/components/ui/card';

export default function SustainabilitySettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Configure sustainability platform settings.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium">Sustainability Platform</h2>
        <p className="text-sm text-[rgb(var(--muted))]">Settings for sustainability programs, ESG goals, KPIs, initiatives, and reporting will appear here.</p>
      </Card>
    </div>
  );
}