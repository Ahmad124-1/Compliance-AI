'use client';

import { useMemo } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { useWellbeingTips } from '@/modules/engagement/store.js';
import { Lightbulb } from 'lucide-react';

export default function WellbeingTipsPage() {
  const { data: tips, isLoading } = useWellbeingTips();

  const physicalTips = useMemo(() => tips?.filter((t: any) => t.topic === 'physical') ?? [], [tips]);
  const mentalTips = useMemo(() => tips?.filter((t: any) => t.topic === 'mental') ?? [], [tips]);
  const safetyTips = useMemo(() => tips?.filter((t: any) => t.topic === 'safety') ?? [], [tips]);

  const renderTip = (tip: any) => (
    <Card key={tip.id} className="p-4">
      <div className="flex items-start gap-2">
        <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
        <div>
          <p className="text-sm font-medium">{tip.topic}</p>
          <p className="text-xs text-[rgb(var(--muted))]">{tip.text}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tips & Resources</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Wellbeing resources and emergency support</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Mental Wellbeing</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {mentalTips.length ? mentalTips.map(renderTip) : <EmptyState title="No tips" description="Mental wellbeing tips will appear here." />}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Physical Wellbeing</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {physicalTips.length ? physicalTips.map(renderTip) : <EmptyState title="No tips" description="Physical wellbeing tips will appear here." />}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Health & Safety</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {safetyTips.length ? safetyTips.map(renderTip) : <EmptyState title="No tips" description="Safety reminders will appear here." />}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
