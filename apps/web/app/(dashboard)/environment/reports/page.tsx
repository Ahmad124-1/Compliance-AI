'use client';

import { Plus, FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import { ENVIRONMENTAL_REPORT_TYPES } from '@/modules/environment/constants.js';
import Link from 'next/link';

export default function EnvironmentalReportsPage() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['environment', 'reports'],
    queryFn: () => environmentService.listReports(),
  });

  const getTypeLabel = (type: string) => {
    const found = ENVIRONMENTAL_REPORT_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Reports</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Generate and manage environmental reports.</p>
        </div>
        <Link href="/dashboard/environment/reports/new">
          <Button><Plus className="h-4 w-4 mr-1" /> New Report</Button>
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
                  <th className="p-2 text-left">Format</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Created</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports?.map((r) => (
                  <tr key={r.id} className="border-b border-[rgb(var(--border-color))] hover:bg-[rgb(var(--panel-2))]">
                    <td className="p-2 font-medium">{r.name}</td>
                    <td className="p-2 capitalize">{getTypeLabel(r.reportType)}</td>
                    <td className="p-2 uppercase">{r.format}</td>
                    <td className="p-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        r.status === 'generated' ? 'bg-green-100 text-green-800' :
                        r.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-2">{r.createdAt?.slice(0, 10)}</td>
                    <td className="p-2">
                      {r.fileUrl && (
                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Download</Button>
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!reports || reports.length === 0) && (
              <p className="p-4 text-center text-sm text-[rgb(var(--muted))]">No reports found.</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
