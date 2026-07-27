'use client';

import { useState } from 'react';
import { Siren, AlertTriangle } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useEmergencyAlerts, useCreateEmergencyAlert, useAcknowledgeEmergency } from '@/modules/communication-hub/store.js';
import { EMERGENCY_TYPES } from '@/modules/communication-hub/constants.js';

export default function EmergencyPage() {
  const { data: alerts, isLoading, refetch } = useEmergencyAlerts();
  const create = useCreateEmergencyAlert();
  const acknowledge = useAcknowledgeEmergency();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [alertType, setAlertType] = useState('fire');
  const [severity, setSeverity] = useState('high');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ title, body, alertType, severity });
    setTitle('');
    setBody('');
    setShowForm(false);
    refetch();
  };

  const handleAcknowledge = async (id: string) => {
    await acknowledge.mutateAsync({ alertId: id, data: { status: 'acknowledged' } });
    refetch();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Emergency Alert Center</h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            Fire, medical, chemical spill, earthquake, evacuation, weather, security
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'ghost' : 'default'}>
          <Siren className="h-4 w-4" /> New Alert
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 border-red-200">
          <h2 className="mb-4 text-lg font-semibold text-red-700">Create Emergency Alert</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title" error={undefined}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Body" error={undefined}>
              <textarea
                className="flex w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Alert Type" error={undefined}>
                <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
                  {EMERGENCY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Severity" error={undefined}>
                <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>
            <Button type="submit" variant="default" className="bg-red-600 text-white hover:bg-red-700">Send Emergency Alert</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-[rgb(var(--muted))]">Loading...</p>}
        {(alerts ?? []).map((alert) => (
          <Card key={alert.id} className={`p-4 ${alert.isActive ? 'border-red-200 bg-red-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-[rgb(var(--muted))]">{alert.alertType} • {alert.severity} • {new Date(alert.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm">{alert.body}</p>
                  <div className="mt-2 flex gap-2 text-xs text-[rgb(var(--muted))]">
                    <span>Acknowledged: {alert.acknowledgedCount}/{alert.totalRecipients}</span>
                    {alert.isActive && <span className="font-semibold text-red-600">ACTIVE</span>}
                  </div>
                </div>
              </div>
              {alert.isActive && (
                <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                  Acknowledge
                </Button>
              )}
            </div>
          </Card>
        ))}
        {(!alerts || alerts.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No emergency alerts</p>
          </Card>
        )}
      </div>
    </div>
  );
}
