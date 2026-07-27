'use client';

import { useMemo } from 'react';
import { AlertTriangle, Phone, Clock } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { useEmergencyContacts } from '@/modules/worker-ai/store.js';
import { EMERGENCY_TYPE_LABELS } from '@/modules/worker-ai/constants.js';

export default function WorkerAiEmergencyPage() {
  const { data: contacts, isLoading } = useEmergencyContacts();

  const grouped = useMemo(() => {
    if (!contacts) return {};
    return contacts.reduce<Record<string, typeof contacts>>((acc, c) => {
      acc[c.type] = acc[c.type] || [];
      acc[c.type].push(c);
      return acc;
    }, {} as Record<string, typeof contacts>);
  }, [contacts]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Emergency Assistance</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Quick help for fire, medical emergency, chemical spill, evacuation, accident reporting, and emergency contacts.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" />
        </div>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <Card key={type} className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-[rgb(var(--primary))]" />
            <h2 className="text-base font-semibold">{EMERGENCY_TYPE_LABELS[type] ?? type}</h2>
          </div>
          <div className="space-y-3">
            {(items as any[]).map((contact) => (
              <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-3">
                <div>
                  <p className="text-sm font-medium">{contact.name}</p>
                  {contact.description && <p className="text-xs text-[rgb(var(--muted))]">{contact.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {contact.available24x7 && (
                    <span className="flex items-center gap-1 text-xs text-[rgb(var(--success))]">
                      <Clock className="h-3 w-3" /> 24x7
                    </span>
                  )}
                  <Button size="sm" variant="outline">
                    <Phone className="h-3 w-3 mr-1" /> {contact.phone}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {!isLoading && Object.keys(grouped).length === 0 && (
        <Card className="p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[rgb(var(--muted-2))]" />
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">No emergency contacts configured.</p>
        </Card>
      )}
    </div>
  );
}
