'use client';

import { useState } from 'react';
import { Plus, TreePine, Leaf, Bug, LandPlot, Sprout } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { BIODIVERSITY_RECORD_TYPES, BIODIVERSITY_STATUSES } from '@/modules/environment/constants.js';
import Link from 'next/link';

export default function BiodiversityPage() {
  const { data: records, isLoading } = useQuery({
    queryKey: ['environment', 'biodiversity'],
    queryFn: () => environmentService.listBiodiversity(),
  });

  const { data: kpis } = useQuery({
    queryKey: ['environment', 'biodiversity', 'kpis'],
    queryFn: () => environmentService.getBiodiversityKpis(),
    enabled: true,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Biodiversity</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Track protected areas, tree planting, habitat restoration, and species monitoring.</p>
        </div>
        <Link href="/dashboard/environment/biodiversity/new">
          <Button><Plus className="h-4 w-4 mr-1" /> New Record</Button>
        </Link>
      </div>

      {kpis && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-green-500" />
              <span className="text-xs text-[rgb(var(--muted))]">Trees Planted</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{kpis.totalTreesPlanted}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              <span className="text-xs text-[rgb(var(--muted))]">Tree Loss</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{kpis.totalTreesLost}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <LandPlot className="h-5 w-5 text-amber-500" />
              <span className="text-xs text-[rgb(var(--muted))]">Protected Area (ha)</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{kpis.totalProtectedArea}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-purple-500" />
              <span className="text-xs text-[rgb(var(--muted))]">Species Monitored</span>
            </div>
            <p className="mt-2 text-lg font-semibold">{kpis.totalSpeciesMonitored}</p>
          </Card>
        </div>
      )}

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
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Trees</th>
                  <th className="p-2 text-left">Area (ha)</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {records?.map((r) => (
                  <tr key={r.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2 capitalize">{r.recordType.replace('_', ' ')}</td>
                    <td className="p-2">{r.location || '-'}</td>
                    <td className="p-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        r.status === 'active' || r.status === 'completed' ? 'bg-green-100 text-green-800' :
                        r.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-2">{r.treesPlanted ?? '-'}</td>
                    <td className="p-2">{r.areaSize ?? '-'}</td>
                    <td className="p-2">{r.startDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!records || records.length === 0) && (
              <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No biodiversity records found.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
