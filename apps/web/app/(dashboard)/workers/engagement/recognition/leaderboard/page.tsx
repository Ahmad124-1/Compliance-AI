'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Skeleton } from '@/components/ui';
import { useLeaderboard } from '@/modules/engagement/store.js';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('month');
  const { data: leaderboard, isLoading } = useLeaderboard({ period });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Top recognized workers</p>
      </div>

      <div className="flex gap-2">
        {['week', 'month', 'year'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded-md border px-3 py-1.5 text-sm capitalize ${period === p ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'border-[rgb(var(--border-color))]'}`}>
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(leaderboard ?? []).length === 0 && <p className="text-sm text-[rgb(var(--muted))]">No recognition data for this period.</p>}
          {(leaderboard ?? []).map((entry, i) => (
            <Card key={entry.userId} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i < 3 ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--panel))]'}`}>{i + 1}</span>
                <div>
                  <p className="text-sm font-medium">{entry.name}</p>
                  {entry.departmentName && <p className="text-xs text-[rgb(var(--muted))]">{entry.departmentName}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold">
                <Trophy className="h-4 w-4 text-amber-500" /> {entry.points}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
