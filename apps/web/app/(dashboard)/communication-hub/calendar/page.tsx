'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useCalendarEvents, useCreateCalendarEvent, useRsvpEvent } from '@/modules/communication-hub/store.js';

export default function CalendarPage() {
  const { data: events, isLoading } = useCalendarEvents();
  const create = useCreateCalendarEvent();
  const rsvp = useRsvpEvent();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ title, eventType, startAt, endAt, location });
    setTitle('');
    setStartAt('');
    setEndAt('');
    setLocation('');
    setShowForm(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar & Events</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Company events, training, audits, safety drills</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Create Event</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Title" error={undefined}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" error={undefined}>
              <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  <option value="meeting">Meeting</option>
                  <option value="training">Training</option>
                  <option value="audit">Audit</option>
                  <option value="safety_drill">Safety Drill</option>
                  <option value="compliance_deadline">Compliance Deadline</option>
                </select>
              </Field>
              <Field label="Location" error={undefined}>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" error={undefined}>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
              </Field>
              <Field label="End" error={undefined}>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} required />
              </Field>
            </div>
            <Button type="submit">Create Event</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-[rgb(var(--muted))]">Loading...</p>}
        {(events ?? []).map((evt) => (
          <Card key={evt.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{evt.title}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{evt.eventType} • {new Date(evt.startAt).toLocaleString()} - {new Date(evt.endAt).toLocaleString()}</p>
                {evt.location && <p className="text-xs text-[rgb(var(--muted))]">Location: {evt.location}</p>}
              </div>
              <Button size="sm" onClick={() => rsvp.mutate({ eventId: evt.id, status: 'accepted' })}>
                RSVP
              </Button>
            </div>
          </Card>
        ))}
        {(!events || events.length === 0) && (
          <Card className="p-8 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">No events scheduled</p>
          </Card>
        )}
      </div>
    </div>
  );
}
