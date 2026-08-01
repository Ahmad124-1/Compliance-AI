'use client';

import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import Link from 'next/link';

export default function EnvironmentalObjectivesPage() {
  const { data: objectives, isLoading } = useQuery({
    queryKey: ['environment', 'objectives'],
    queryFn: () => environmentService.listObjectives(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Objectives</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Manage environmental goals, targets, and track progress.</p>
        </div>
        <Link href="/dashboard/environment/objectives/new">
          <Button><Plus className="h-4 w-4 mr-1" /> New Objective</Button>
        </Link>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-full rounded bg-[rgb(var(--muted))]" />
            <div className="h-4 w-full rounded bg-[rgb(var(--muted))]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border-color))]">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Priority</th>
                  <th className="p-2 text-left">Target</th>
                  <th className="p-2 text-left">Progress</th>
                  <th className="p-2 text-left">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {objectives?.map((o) => (
                  <tr key={o.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2 font-medium">{o.name}</td>
                    <td className="p-2 capitalize">{o.objectiveType.replace('_', ' ')}</td>
                    <td className="p-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${getStatusColor(o.status)}`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-2">
                      <span className={`font-medium capitalize ${getPriorityColor(o.priority)}`}>
                        {o.priority}
                      </span>
                    </td>
                    <td className="p-2">{o.targetValue} {o.unit}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-[rgb(var(--muted))]">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${o.targetValue > 0 ? Math.min(100, ((o.currentValue ?? 0) / o.targetValue) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs">{o.currentValue ?? 0}/{o.targetValue}</span>
                      </div>
                    </td>
                    <td className="p-2">{o.targetDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!objectives || objectives.length === 0) && (
              <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No environmental objectives found.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
