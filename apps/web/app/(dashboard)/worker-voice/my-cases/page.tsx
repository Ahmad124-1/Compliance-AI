'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { useMyCases } from '@/modules/worker-voice/module.store.js';
import type { WorkerVoiceCase } from '@/modules/worker-voice/module.types.js';

export default function MyCasesPage() {
  const router = useRouter();
  const { data: cases = [], isLoading } = useMyCases();

  if (isLoading) {
    return <div className="mx-auto max-w-6xl"><p className="text-sm text-[rgb(var(--muted))]">Loading cases…</p></div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Cases</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Track and manage your reported concerns
        </p>
      </div>

      <Card className="p-6">
        {cases.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">You have no assigned cases.</p>
            <Button className="mt-4" onClick={() => router.push('/worker-voice')}>
              Report a Concern
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-color))]">
                  <th className="pb-2 text-left font-medium">Case Number</th>
                  <th className="pb-2 text-left font-medium">Title</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Priority</th>
                  <th className="pb-2 text-left font-medium">Category</th>
                  <th className="pb-2 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {(cases as WorkerVoiceCase[]).map((c) => (
                  <tr key={c.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="py-2 font-mono text-xs">{c.caseNumber}</td>
                    <td className="py-2">{c.title}</td>
                    <td className="py-2 capitalize">{c.status.replace(/_/g, ' ')}</td>
                    <td className="py-2 capitalize">{c.priority}</td>
                    <td className="py-2 capitalize">{c.category.replace(/_/g, ' ')}</td>
                    <td className="py-2 text-[rgb(var(--muted))]">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
