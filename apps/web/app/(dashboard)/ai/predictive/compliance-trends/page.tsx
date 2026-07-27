'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card.js';
import { predictiveApi } from '@/modules/predictive/api.js';

function TrendBadge({ direction }: { direction: string }) {
  const color = direction === 'up' ? 'bg-red-100 text-red-700' : direction === 'down' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  const label = direction === 'up' ? 'Increasing' : direction === 'down' ? 'Decreasing' : 'Stable';
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

export default function ComplianceTrendsPage() {
  const { data: trends, isLoading } = useQuery({
    queryKey: ['compliance-trends'],
    queryFn: () => predictiveApi.complianceTrends(),
  });

  const series = trends as { score: any[]; violations: any[]; training: any[]; audits: any[] } | undefined;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compliance Trends</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Analyze monthly, yearly, audit, violation, training, worker and department trends.</p>
      </div>

      {isLoading ? (
        <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">Loading trends…</p></Card>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {series ? (
            Object.entries(series).map(([key, rows]) => (
              <Card key={key} className="p-4">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{key}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[rgb(var(--panel-2))]">
                        <th className="px-2 py-1 text-left">Period</th>
                        <th className="px-2 py-1 text-right">Value</th>
                        <th className="px-2 py-1 text-right">Change</th>
                        <th className="px-2 py-1 text-left">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(rows as any[]).slice(0, 12).map((r: any, idx: number) => (
                        <tr key={idx} className="border-t border-[rgb(var(--border-color))]">
                          <td className="px-2 py-1">{r.period}</td>
                          <td className="px-2 py-1 text-right">{Number(r.value).toFixed(2)}</td>
                          <td className="px-2 py-1 text-right">{r.changePercent != null ? `${r.changePercent.toFixed(2)}%` : '—'}</td>
                          <td className="px-2 py-1"><TrendBadge direction={r.direction} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4"><p className="text-xs text-[rgb(var(--muted))]">No trend data available.</p></Card>
          )}
        </section>
      )}
    </div>
  );
}
