'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field } from '@/components/ui/Field.js';
import { useHotlineContacts, useEmergencyReport } from '@/modules/worker-voice/module.store.js';

export default function EthicsHotlinePage() {
  const { data: contacts = [], isLoading } = useHotlineContacts();
  const [submitted, setSubmitted] = useState<string | null>(null);

  if (isLoading) {
    return <div className="mx-auto max-w-6xl"><p className="text-sm text-[rgb(var(--muted))]">Loading hotline…</p></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ethics Hotline</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Confidential reporting and emergency contacts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {contacts.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{c.name}</span>
              {c.is24x7 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-200">24/7</span>
              )}
            </div>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{c.description}</p>
            <div className="mt-3 space-y-1">
              {c.phone && <p className="text-sm font-mono">{c.phone}</p>}
              {c.email && <p className="text-sm font-mono">{c.email}</p>}
              {c.availableHours && <p className="text-xs text-[rgb(var(--muted))]">{c.availableHours}</p>}
            </div>
          </Card>
        ))}
      </div>

      {submitted ? (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-green-600">Emergency Report Submitted</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Reference ID: <span className="font-mono">{submitted}</span>
          </p>
          <Button className="mt-4" variant="ghost" onClick={() => setSubmitted(null)}>Submit another</Button>
        </Card>
      ) : (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Emergency Report</h2>
          <EmergencyReportForm onSubmit={setSubmitted} />
        </Card>
      )}
    </div>
  );
}

function EmergencyReportForm({ onSubmit }: { onSubmit: (id: string) => void }) {
  const { mutateAsync: submitEmergency } = useEmergencyReport();
  const [type, setType] = useState('safety');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await submitEmergency({ emergencyType: type, description });
      onSubmit(result.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Emergency Type" error={undefined}>
        <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="safety">Safety Hazard</option>
          <option value="violence">Violence / Threat</option>
          <option value="medical">Medical Emergency</option>
          <option value="legal">Legal / Regulatory</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Description" error={undefined}>
        <textarea
          className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the emergency..."
        />
      </Field>
      <Button type="submit" disabled={false}>
        Submit Emergency Report
      </Button>
    </form>
  );
}
