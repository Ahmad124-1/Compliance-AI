'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { useGrievances, useUpdateGrievance } from '@/modules/grievances/module.store.js';
import { GRIEVANCE_STATUS_LABELS, GRIEVANCE_PRIORITY_LABELS } from '@/modules/grievances/module.constants.js';

export default function AdminGrievancesPage() {
  const { data: grievances, refetch } = useGrievances();
  const _update = useUpdateGrievance();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = grievances?.filter((_g) => {
    return true;
  });

  if (selectedId) {
    const grievance = grievances?.find((g) => g.id === selectedId);
    if (grievance) {
      return <GrievanceDetail grievance={grievance} onBack={() => setSelectedId(null)} onUpdate={refetch} />;
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-semibold">Grievances</h1>

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {filtered?.map((g) => (
          <div key={g.id} className="flex items-center justify-between p-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{g.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {g.trackingNumber} · {g.category} · {GRIEVANCE_STATUS_LABELS[g.status] ?? g.status}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {new Date(g.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(g.status)}`}>
                {GRIEVANCE_STATUS_LABELS[g.status] ?? g.status}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor(g.priority)}`}>
                {GRIEVANCE_PRIORITY_LABELS[g.priority] ?? g.priority}
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedId(g.id)}>
                View
              </Button>
            </div>
          </div>
        ))}
        {filtered?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No grievances found.</p>}
      </Card>
    </div>
  );
}

function GrievanceDetail({ grievance, onBack, onUpdate }: { grievance: any; onBack: () => void; onUpdate: () => void }) {
  const [status, setStatus] = useState(grievance.status);
  const [priority, setPriority] = useState(grievance.priority);
  const update = useUpdateGrievance();

  const handleUpdate = async () => {
    await update.mutateAsync({ id: grievance.id, patch: { status, priority } });
    onUpdate();
    onBack();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack}>Back</Button>
        <h1 className="text-2xl font-semibold">Grievance Details</h1>
      </div>

      <Card className="p-6">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">Tracking Number</p>
            <p className="font-mono font-semibold">{grievance.trackingNumber}</p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">Tracking PIN</p>
            <p className="font-mono font-semibold">{grievance.trackingPIN}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium">{grievance.title}</p>
          <p className="text-sm text-[rgb(var(--muted))]">{grievance.description}</p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">Category</p>
            <p className="font-medium">{grievance.category}</p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">Source</p>
            <p className="font-medium">{grievance.source}</p>
          </div>
          <div>
            <p className="text-xs text-[rgb(var(--muted))]">Language</p>
            <p className="font-medium">{grievance.language}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium mb-1">Status</p>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(GRIEVANCE_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Priority</p>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {Object.entries(GRIEVANCE_PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleUpdate}>Save Changes</Button>
          <Button size="sm" variant="ghost" onClick={onBack}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'under_review': return 'bg-blue-100 text-blue-700';
    case 'escalated': return 'bg-red-100 text-red-700';
    case 'resolved': return 'bg-green-100 text-green-700';
    case 'closed': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'critical': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
