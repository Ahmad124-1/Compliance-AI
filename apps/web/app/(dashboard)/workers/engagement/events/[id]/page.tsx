'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { useEvent, useEventAttendance, useSignInToEvent } from '@/modules/engagement/store.js';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [eventId, setEventId] = useState('');

  if (!resolvedParams && params instanceof Promise) {
    params.then((p) => { setResolvedParams(p); setEventId(p.id); });
  }

  const currentId = resolvedParams?.id ?? eventId;
  const { data: event, isLoading } = useEvent(currentId);
  const { data: attendance } = useEventAttendance(currentId);
  const { mutateAsync: signIn } = useSignInToEvent();

  if (isLoading) return <div className="mx-auto max-w-4xl"><Skeleton className="h-64 w-full" /></div>;
  if (!event) return <EmptyState title="Event not found" description="This event may have been cancelled." />;

  const handleSignIn = async () => {
    await signIn(event.id);
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">{event.title}</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{event.description || 'No description provided.'}</p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[rgb(var(--muted))]" /> {new Date(event.startAt).toLocaleString()}</div>
          {event.endAt && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[rgb(var(--muted))]" /> to {new Date(event.endAt).toLocaleString()}</div>}
          {event.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[rgb(var(--muted))]" /> {event.location}</div>}
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[rgb(var(--muted))]" /> {event.status}</div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Attendance</h2>
          <button onClick={handleSignIn} className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90">
            <CheckCircle className="h-4 w-4" /> Sign In
          </button>
        </div>
        <div className="mt-4">
          {(attendance ?? []).length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No attendance records yet.</p>}
          {(attendance ?? []).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] px-3 py-2 text-sm">
              <span>{a.userId}</span>
              <span className="text-xs text-[rgb(var(--muted))]">{a.rsvpStatus} · {a.checkedInAt ? 'Checked in' : 'Registered'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
