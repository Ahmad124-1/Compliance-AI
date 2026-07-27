'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useSelfAssess, useBurnoutRisk } from '@/modules/engagement/store.js';
import { Smile, Meh, Frown } from 'lucide-react';

export default function WellbeingCheckinPage() {
  const { mutateAsync: selfAssess, isLoading } = useSelfAssess();
  const { data: burnout } = useBurnoutRisk();
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    await selfAssess({
      assessmentType: 'daily',
      scores: { mood, stress, energy },
      indicators: stress > 7 ? [{ level: 'high', type: 'stress' }] : [],
    });
    window.location.href = '/workers/engagement/wellbeing';
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Daily Wellbeing Check-in</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Take a moment to reflect on your day.</p>

        {burnout?.risk === 'high' && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            You are showing high burnout risk. Please consider speaking with your manager or using the employee assistance program.
          </div>
        )}

        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium">Mood</label>
            <div className="mt-2 flex items-center gap-2">
              <Frown className="h-4 w-4 text-red-500" />
              <input type="range" min="1" max="10" value={mood} onChange={(e) => setMood(Number(e.target.value))} className="flex-1" />
              <Smile className="h-4 w-4 text-green-500" />
              <span className="ml-2 text-sm font-medium w-6 text-center">{mood}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Stress Level</label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[rgb(var(--muted))]">Low</span>
              <input type="range" min="1" max="10" value={stress} onChange={(e) => setStress(Number(e.target.value))} className="flex-1" />
              <span className="text-xs text-[rgb(var(--muted))]">High</span>
              <span className="ml-2 text-sm font-medium w-6 text-center">{stress}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Energy Level</label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[rgb(var(--muted))]">Low</span>
              <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="flex-1" />
              <span className="text-xs text-[rgb(var(--muted))]">High</span>
              <span className="ml-2 text-sm font-medium w-6 text-center">{energy}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" rows={2} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isLoading}>Submit Check-in</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
