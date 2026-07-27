'use client';

import { useMemo } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { useRecognitionHistory } from '@/modules/engagement/store.js';
import { Award } from 'lucide-react';

export default function RecognitionHistoryPage() {
  const { data: history, isLoading } = useRecognitionHistory();

  const sorted = useMemo(() => (history ?? []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [history]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recognition History</h1>
        <p className="text-sm text-[rgb(var(--muted))]">All recognition received</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No recognition history yet.</p>}
          {sorted.map((r) => (
            <Card key={r.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-[rgb(var(--primary))]" />
                <div>
                  <p className="text-sm font-medium">{r.message}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{r.category} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="text-sm font-semibold">+{r.pointsAwarded}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
