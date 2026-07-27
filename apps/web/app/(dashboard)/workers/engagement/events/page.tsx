'use client';

import { useMemo } from 'react';
import Link from 'next/link';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { useEvents } from '@/modules/engagement/store.js';
import { ENGAGEMENT_ROUTES } from '@/modules/engagement/constants.js';
import { Calendar, Plus } from 'lucide-react';

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();

  const upcoming = useMemo(() => (events ?? []).filter((e) => new Date(e.startAt) > new Date()), [events]);
  const past = useMemo(() => (events ?? []).filter((e) => new Date(e.startAt) <= new Date()), [events]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Training, meetings, and town halls</p>
        </div>
        <Link href={`${ENGAGEMENT_ROUTES.events}/new`}>
          <button className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90">
            <Plus className="h-4 w-4" /> Create Event
          </button>
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Upcoming</h2>
        {isLoading ? <Skeleton className="h-32 w-full" /> : upcoming.length === 0 ? <EmptyState title="No upcoming events" description="Check back later for scheduled events." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((e) => (
              <Link key={e.id} href={`${ENGAGEMENT_ROUTES.events}/${e.id}`}>
                <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-[rgb(var(--primary))]" />
                    <div>
                      <h3 className="text-sm font-medium">{e.title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.startAt).toLocaleString()} · {e.location || 'TBD'}</p>
                      <span className="mt-1 inline-block rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">{e.eventType}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Past</h2>
        {isLoading ? <Skeleton className="h-32 w-full" /> : past.length === 0 ? <EmptyState title="No past events" description="Completed events will appear here." /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {past.map((e) => (
              <Link key={e.id} href={`${ENGAGEMENT_ROUTES.events}/${e.id}`}>
                <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-[rgb(var(--muted))]" />
                    <div>
                      <h3 className="text-sm font-medium">{e.title}</h3>
                      <p className="text-xs text-[rgb(var(--muted))]">{new Date(e.startAt).toLocaleString()} · {e.location || 'TBD'}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
