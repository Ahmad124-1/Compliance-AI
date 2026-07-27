'use client';

import { useState } from 'react';
import { Droplets, Trash2, Wind, FlaskConical, AlertTriangle, FileCheck, Shield, Leaf, Zap, Target, Brain, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useQuery } from '@tanstack/react-query';
import { environmentService } from '@/modules/environment/service.js';
import Link from 'next/link';

export default function EnvironmentDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['environment', 'dashboard'],
    queryFn: () => environmentService.getDashboard(),
  });

  const statCards = dashboard
    ? [
        { label: 'Water Usage', value: `${dashboard.totalWaterUsage.toLocaleString()} m³`, icon: Droplets, color: 'text-blue-500', href: '/dashboard/environment/water' },
        { label: 'Waste Generated', value: `${dashboard.totalWasteGenerated.toLocaleString()} kg`, icon: Trash2, color: 'text-amber-500', href: '/dashboard/environment/waste' },
        { label: 'Hazardous Waste', value: `${dashboard.hazardousWaste.toLocaleString()} kg`, icon: AlertTriangle, color: 'text-red-500', href: '/dashboard/environment/waste' },
        { label: 'Air Emissions', value: `${dashboard.totalAirEmissions.toLocaleString()} kg`, icon: Wind, color: 'text-purple-500', href: '/dashboard/environment/air' },
        { label: 'Chemicals', value: dashboard.totalChemicals.toString(), icon: FlaskConical, color: 'text-pink-500', href: '/dashboard/environment/chemicals' },
        { label: 'Active Incidents', value: dashboard.activeIncidents.toString(), icon: AlertTriangle, color: 'text-orange-500', href: '/dashboard/environment/incidents' },
        { label: 'Compliance Score', value: `${dashboard.complianceScore}%`, icon: FileCheck, color: 'text-emerald-500', href: '/dashboard/environment/permits' },
        { label: 'High Risks', value: dashboard.highRisks.toString(), icon: Shield, color: 'text-red-600', href: '/dashboard/environment/risks' },
        { label: 'Active Projects', value: `${dashboard.activeProjects}/${dashboard.totalProjects}`, icon: Leaf, color: 'text-green-600', href: '/dashboard/environment/projects' },
        { label: 'Resource Efficiency', value: `${dashboard.resourceEfficiency}%`, icon: Zap, color: 'text-yellow-600', href: '/dashboard/environment/resources' },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Environmental Management</h1>
          <p className="text-sm text-[rgb(var(--muted))]">ISO 14001 aligned environmental performance overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/environment/incidents">
            <Button variant="default" size="sm"><AlertTriangle className="h-4 w-4 mr-1" /> Report Incident</Button>
          </Link>
          <Link href="/dashboard/environment/risks">
            <Button variant="outline" size="sm"><Shield className="h-4 w-4 mr-1" /> Risk Register</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-20 rounded bg-[rgb(var(--muted))] animate-pulse" />
              <div className="mt-2 h-8 w-16 rounded bg-[rgb(var(--muted))] animate-pulse" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href}>
                  <Card className="p-4 transition-colors hover:bg-[rgb(var(--panel-2))]">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${card.color}`} />
                      <span className="text-xs text-[rgb(var(--muted))]">{card.label}</span>
                    </div>
                    <p className="mt-2 text-lg font-semibold">{card.value}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Monthly Water Trend</h3>
              <div className="flex h-32 items-end gap-1">
                {dashboard?.monthlyWaterTrend?.map((d) => (
                  <div key={d.month} className="flex-1 rounded bg-blue-500/80 hover:bg-blue-500" style={{ height: `${Math.min(100, (d.usage / Math.max(...(dashboard.monthlyWaterTrend.map((m) => m.usage)), 1)) * 100)}%` }} title={`${d.month}: ${d.usage} m³`} />
                )) || <span className="text-xs text-[rgb(var(--muted))]">No data</span>}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Monthly Waste Trend</h3>
              <div className="flex h-32 items-end gap-1">
                {dashboard?.monthlyWasteTrend?.map((d) => (
                  <div key={d.month} className="flex-1 rounded bg-amber-500/80 hover:bg-amber-500" style={{ height: `${Math.min(100, (d.generated / Math.max(...(dashboard.monthlyWasteTrend.map((m) => m.generated)), 1)) * 100)}%` }} title={`${d.month}: ${d.generated} kg`} />
                )) || <span className="text-xs text-[rgb(var(--muted))]">No data</span>}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Monthly Air Emissions</h3>
              <div className="flex h-32 items-end gap-1">
                {dashboard?.monthlyAirTrend?.map((d) => (
                  <div key={d.month} className="flex-1 rounded bg-purple-500/80 hover:bg-purple-500" style={{ height: `${Math.min(100, (d.emissions / Math.max(...(dashboard.monthlyAirTrend.map((m) => m.emissions)), 1)) * 100)}%` }} title={`${d.month}: ${d.emissions} kg`} />
                )) || <span className="text-xs text-[rgb(var(--muted))]">No data</span>}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Incident Trend</h3>
              <div className="flex h-32 items-end gap-1">
                {dashboard?.incidentTrend?.map((d) => (
                  <div key={d.month} className="flex-1 rounded bg-orange-500/80 hover:bg-orange-500" style={{ height: `${Math.min(100, (d.count / Math.max(...(dashboard.incidentTrend.map((m) => m.count)), 1)) * 100)}%` }} title={`${d.month}: ${d.count}`} />
                )) || <span className="text-xs text-[rgb(var(--muted))]">No data</span>}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Permit Status</h3>
              <div className="space-y-2">
                {dashboard?.permitStatusDistribution?.map((d) => (
                  <div key={d.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-[rgb(var(--muted))]">{d.status.replace('_', ' ')}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Risk Score Distribution</h3>
              <div className="space-y-2">
                {dashboard?.riskScoreDistribution?.map((d) => (
                  <div key={d.level} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-[rgb(var(--muted))]">{d.level}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-medium">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard/environment/water"><Button variant="outline" size="sm" className="justify-start"><Droplets className="h-4 w-4 mr-2" /> Log Water Usage</Button></Link>
                <Link href="/dashboard/environment/waste"><Button variant="outline" size="sm" className="justify-start"><Trash2 className="h-4 w-4 mr-2" /> Record Waste</Button></Link>
                <Link href="/dashboard/environment/incidents"><Button variant="outline" size="sm" className="justify-start"><AlertTriangle className="h-4 w-4 mr-2" /> Report Incident</Button></Link>
                <Link href="/dashboard/environment/risks"><Button variant="outline" size="sm" className="justify-start"><Shield className="h-4 w-4 mr-2" /> Add Risk</Button></Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
