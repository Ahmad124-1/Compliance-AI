'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Edit2, Save, X, Loader2, Trash2, Activity, Calendar, User,
  TrendingUp, AlertTriangle, Target, BarChart3, LineChart as LineChartIcon,
  FileText, MessageSquare, Clock, Plus,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { LineChart, StatTile } from '@/components/ui/charts';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { KPI_TYPES, KPI_FREQUENCIES } from '@/modules/sustainability/constants.js';
import { useChat } from '@/modules/ai/hooks.js';

const kpiEditSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  kpiType: z.enum(['numeric', 'percentage', 'ratio', 'currency', 'intensity', 'count', 'boolean']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  unit: z.string().min(1),
  targetValue: z.coerce.number().nullable().optional(),
  baselineValue: z.coerce.number().nullable().optional(),
  thresholdWarning: z.coerce.number().nullable().optional(),
  thresholdCritical: z.coerce.number().nullable().optional(),
  aggregation: z.enum(['latest', 'sum', 'avg', 'min', 'max', 'count']).optional(),
});

type KpiEditData = z.infer<typeof kpiEditSchema>;

export default function KpiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState('');

  const chatMutation = useChat();

  const { data: kpi, isLoading, isError, refetch } = useQuery({
    queryKey: ['sustainability', 'kpi', id],
    queryFn: () => sustainabilityService.getKpi(id),
  });

  const { data: measurements } = useQuery({
    queryKey: ['sustainability', 'measurements', id],
    queryFn: () => sustainabilityService.getKpiMeasurements(id, { limit: 50 }),
    enabled: !!id,
  });

  const { data: trend } = useQuery({
    queryKey: ['sustainability', 'kpi-trend', id],
    queryFn: () => sustainabilityService.getKpiTrend(id, { fromDate: '', toDate: '' }),
    enabled: !!id,
  });

  const { data: aggregated } = useQuery({
    queryKey: ['sustainability', 'kpi-aggregated', id],
    queryFn: () => sustainabilityService.getKpiAggregated(id, { frequency: 'monthly' }),
    enabled: !!id,
  });

  const {
    register, handleSubmit, reset, formState: { errors, isDirty },
  } = useForm<KpiEditData>({ resolver: zodResolver(kpiEditSchema) });

  useEffect(() => {
    if (kpi) {
      reset({
        name: kpi.name, description: kpi.description || '', kpiType: kpi.kpiType,
        frequency: kpi.frequency, unit: kpi.unit, targetValue: kpi.targetValue,
        baselineValue: kpi.baselineValue, thresholdWarning: kpi.thresholdWarning,
        thresholdCritical: kpi.thresholdCritical, aggregation: kpi.aggregation,
      });
    }
  }, [kpi, reset]);

  useEffect(() => { setHasUnsaved(isDirty); }, [isDirty]);

  const updateMutation = useMutation({
    mutationFn: (data: KpiEditData) => sustainabilityService.updateKpi(id, data),
    onSuccess: () => {
      toast({ title: 'KPI updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpi', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpis'] });
      setIsEditing(false); setHasUnsaved(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sustainabilityService.deleteKpi(id),
    onSuccess: () => { toast({ title: 'KPI deleted', variant: 'success' }); router.push('/sustainability/kpis'); },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const measurementMutation = useMutation({
    mutationFn: (value: number) => sustainabilityService.recordMeasurement(id, { value }),
    onSuccess: () => {
      toast({ title: 'Measurement recorded', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'measurements', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'kpi-trend', id] });
      setNewMeasurement('');
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'error' }),
  });

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setAiResponse('');
    try {
      const result = await chatMutation.mutateAsync({
        conversationId: `sustainability-kpi-${id}`,
        message: `Regarding the KPI "${kpi?.name}" (${kpi?.kpiType}, target: ${kpi?.targetValue} ${kpi?.unit}): ${aiMessage}`,
        useRag: true,
        systemPrompt: 'You are a sustainability AI copilot. Analyze KPI data and provide insights about performance, trends, and recommendations.',
      });
      setAiResponse(result.text);
    } catch { setAiResponse('Failed to get AI response.'); }
  };

  const onSubmit = (data: KpiEditData) => updateMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (isError || !kpi) return <ErrorState title="KPI not found" onRetry={() => refetch()} />;

  const latestValue = measurements?.[0]?.value;
  const targetMet = kpi.targetValue !== null && latestValue !== undefined
    ? kpi.kpiType === 'boolean' ? latestValue === kpi.targetValue
      : latestValue >= kpi.targetValue
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sustainability/kpis"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{kpi.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">{kpi.kpiType}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">{kpi.frequency}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">KPI · {kpi.unit}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit2 className="mr-1 h-3 w-3" />Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Latest Value" value={latestValue ?? '-'} hint={`${kpi.unit}`} />
        <StatTile label="Target" value={kpi.targetValue ?? '-'} hint={`${kpi.unit}`} />
        <StatTile label="Baseline" value={kpi.baselineValue ?? '-'} />
        <StatTile label="Measurements" value={measurements?.length ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit/View */}
          {isEditing ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">Edit KPI</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}><X className="h-4 w-4" /> Cancel</Button>
                  <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                  </Button>
                </div>
              </div>
              <form className="space-y-4">
                <Field label="KPI Name" error={errors.name?.message}><Input {...register('name')} /></Field>
                <Field label="Description"><Textarea {...register('description')} rows={2} /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Type">
                    <select {...register('kpiType')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {KPI_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Frequency">
                    <select {...register('frequency')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {KPI_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Unit" error={errors.unit?.message}><Input {...register('unit')} /></Field>
                  <Field label="Target"><Input type="number" {...register('targetValue')} /></Field>
                  <Field label="Baseline"><Input type="number" {...register('baselineValue')} /></Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Warning Threshold"><Input type="number" {...register('thresholdWarning')} /></Field>
                  <Field label="Critical Threshold"><Input type="number" {...register('thresholdCritical')} /></Field>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">KPI Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Description</p>
                  <p className="mt-1 text-sm">{kpi.description || 'No description.'}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Target: {kpi.targetValue ?? '-'} {kpi.unit}</span></div>
                  <div className="flex items-center gap-2 text-sm"><TrendingUp className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Baseline: {kpi.baselineValue ?? '-'} {kpi.unit}</span></div>
                  <div className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Warning: {kpi.thresholdWarning ?? '-'} | Critical: {kpi.thresholdCritical ?? '-'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Aggregation: {kpi.aggregation}</span></div>
                </div>
              </div>
            </Card>
          )}

          {/* Record Measurement */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Record Measurement</h2>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  step="any"
                  placeholder={`Enter value in ${kpi.unit}`}
                  value={newMeasurement}
                  onChange={(e) => setNewMeasurement(e.target.value)}
                />
              </div>
              <Button onClick={() => measurementMutation.mutate(Number(newMeasurement))}
                disabled={!newMeasurement || measurementMutation.isPending}>
                {measurementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Record
              </Button>
            </div>
          </Card>

          {/* Trend Chart */}
          {trend && Array.isArray(trend) && trend.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Trend</h2>
              <LineChart
                data={trend.map((m: any) => ({
                  label: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: m.value,
                }))}
                height={220}
              />
            </Card>
          )}

          {/* Aggregated Data */}
          {aggregated && Array.isArray(aggregated) && aggregated.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Monthly Aggregated Values</h2>
              <LineChart
                data={aggregated.map((a: any) => ({
                  label: a.period,
                  value: a.value,
                }))}
                height={200}
              />
            </Card>
          )}

          {/* Measurements Table */}
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Measurement History</h2>
            {!measurements?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No measurements recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[rgb(var(--border-color))]">
                    <tr className="text-left text-[rgb(var(--muted))]">
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                      <th className="px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurements.map((m: any) => (
                      <tr key={m.id} className="border-b border-[rgb(var(--border-color))]">
                        <td className="px-3 py-2 font-medium">{m.value} {kpi.unit}</td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{new Date(m.recordedAt).toLocaleString()}</td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{m.source || '-'}</td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Copilot */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">AI Sustainability Copilot</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {['Explain this KPI', 'Analyze trend', 'Compare to target', 'Suggest improvements'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setAiMessage(prompt)}
                    className="rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors"
                  >{prompt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask about this KPI..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()} />
                <Button size="sm" onClick={askAi} disabled={chatMutation.isPending || !aiMessage.trim()}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
              {aiResponse && <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm"><p>{aiResponse}</p></div>}
            </div>
          </Card>

          {/* Threshold Info */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Threshold Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Latest Value</span>
                <span className="font-semibold">{latestValue ?? '-'} {kpi.unit}</span>
              </div>
              {kpi.thresholdWarning !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600">Warning Threshold</span>
                  <span>{kpi.thresholdWarning} {kpi.unit}</span>
                </div>
              )}
              {kpi.thresholdCritical !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">Critical Threshold</span>
                  <span>{kpi.thresholdCritical} {kpi.unit}</span>
                </div>
              )}
              {latestValue !== undefined && kpi.thresholdCritical !== null && latestValue >= kpi.thresholdCritical && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Critical threshold exceeded!
                </div>
              )}
              {latestValue !== undefined && kpi.thresholdWarning !== null && latestValue >= kpi.thresholdWarning && latestValue < (kpi.thresholdCritical ?? Infinity) && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-700">
                  <AlertTriangle className="h-3 w-3" /> Warning threshold reached.
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Created: {new Date(kpi.createdAt).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Updated: {new Date(kpi.updatedAt).toLocaleDateString()}</span></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete KPI" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{kpi.name}"? All measurements will be lost.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

