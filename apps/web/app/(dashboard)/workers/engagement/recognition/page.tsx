'use client';

import { useMemo } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton, EmptyState } from '@/components/ui';
import { useRecognitions, useMyPoints } from '@/modules/engagement/store.js';
import { Award, Trophy } from 'lucide-react';

export default function RecognitionPage() {
  const { data: recognitions, isLoading } = useRecognitions();
  const { data: points } = useMyPoints();

  const recent = useMemo(() => (recognitions ?? []).slice(0, 10), [recognitions]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recognition</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Celebrate achievements and peer recognition</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] px-4 py-2 text-sm">
            <Trophy className="mb-1 h-5 w-5 text-[rgb(var(--primary))]" />
            <p className="font-semibold">{points ?? 0}</p>
            <p className="text-xs text-[rgb(var(--muted))]">My Points</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : recent.length === 0 ? (
        <EmptyState title="No recognitions yet" description="Be the first to recognize a colleague." />
      ) : (
        <div className="space-y-3">
          {recent.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Award className="mt-1 h-5 w-5 text-[rgb(var(--primary))]" />
                  <div>
                    <p className="text-sm font-medium">{r.message}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">From #{r.fromUserId.slice(0, 8)} · {new Date(r.createdAt).toLocaleDateString()} · +{r.pointsAwarded} pts</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
