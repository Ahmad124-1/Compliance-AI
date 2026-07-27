'use client';

import { Card } from '@/components/ui/card.js';

export default function EmergencyHelpPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Emergency Help</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Immediate assistance and emergency contacts
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Emergency Hotline</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">24/7 anonymous reporting</p>
          <p className="mt-2 font-mono text-lg">+1-800-ETHICS</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Local Emergency</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Police, Fire, Medical</p>
          <p className="mt-2 font-mono text-lg">911</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold">On-site Security</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Factory security team</p>
          <p className="mt-2 font-mono text-lg">Ext. 101</p>
        </Card>
      </div>
    </div>
  );
}
