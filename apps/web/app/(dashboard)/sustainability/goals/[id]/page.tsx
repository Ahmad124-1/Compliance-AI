'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Edit2, Save, X, Loader2, Trash2, Target, Calendar, User,
  TrendingUp, AlertTriangle, CheckCircle, Activity, FileText, MessageSquare,
  Upload, BarChart3, Clock, Plus, Eye, Download,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { BarChart, LineChart, StatTile } from '@/components/ui/charts';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { ESG_PILLARS, GOAL_STATUSES } from '@/modules/sustainability/constants.js';
import { useChat } from '@/modules/ai/hooks.js';

const goalEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  esgPillar: z.enum(['environment', 'social', 'governance']),
  baseline: z.coerce.number().nullable().optional(),
  targetValue: z.coerce.number().min(0),
  unit: z.string().min(1),
  currentValue: z.coerce.number().nullable().optional(),
  deadline: z.string().optional(),
  ownerId: z.string().optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.string().optional(),
});

type GoalEditData = z.infer<typeof goalEditSchema>;

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const chatMutation = useChat();

  const { data: goal, isLoading, isError, refetch } = useQuery({
    queryKey: ['sustainability', 'goal', id],
    queryFn: () => sustainabilityService.getGoal(id),
  });

  const { data: kpis } = useQuery({
    queryKey: ['sustainability', 'kpis', { goalId: id }],
    queryFn: () => sustainabilityService.listKpis({ goalId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: kpiTrend } = useQuery({
    queryKey: ['sustainability', 'kpi-trend', id],
    queryFn: () => sustainabilityService.getKpiTrends(id, { fromDate: '', toDate: '' }),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['sustainability', 'evidence', { entityType: 'goal', entityId: id }],
    queryFn: () => sustainabilityService.listEvidenceByEntity('goal', id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<GoalEditData>({
    resolver: zodResolver(goalEditSchema),
  });

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        description: goal.description || '',
        esgPillar: goal.esgPillar,
        baseline: goal.baseline,
        targetValue: goal.targetValue,
        unit: goal.unit,
        currentValue: goal.currentValue,
        deadline: goal.deadline || '',
        ownerId: goal.ownerId || '',
        confidence: goal.confidence,
        riskLevel: goal.riskLevel,
        status: goal.status,
      });
    }
  }, [goal, reset]);

  useEffect(() => {
    setHasUnsaved(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsaved]);

  const updateMutation = useMutation({
    mutationFn: (data: GoalEditData) => sustainabilityService.updateGoal(id, data),
    onSuccess: () => {
      toast({ title: 'Goal updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'goal', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'goals'] });
      setIsEditing(false);
      setHasUnsaved(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sustainabilityService.deleteGoal(id),
    onSuccess: () => {
      toast({ title: 'Goal deleted', variant: 'success' });
      router.push('/dashboard/sustainability/goals');
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setAiResponse('');
    try {
      const result = await chatMutation.mutateAsync({
        conversationId: `sustainability-goal-${id}`,
        message: `Regarding the ESG goal "${goal?.name}": ${aiMessage}`,
        useRag: true,
        systemPrompt: 'You are a sustainability AI copilot. Analyze the ESG goal data and provide insights about performance, risks, and recommendations.',
      });
      setAiResponse(result.text);
    } catch {
      setAiResponse('Failed to get AI response.');
    }
  };

  const onSubmit = (data: GoalEditData) => updateMutation.mutate(data);

  const progressPct = goal ? Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100) : 0;
  const remaining = goal ? (goal.targetValue - (goal.currentValue ?? 0)) : 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (isError || !goal) {
    return <ErrorState title="Goal not found" message="The goal doesn't exist or you don't have access." onRetry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sustainability/goals"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{goal.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${
                goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                goal.status === 'at_risk' ? 'bg-red-100 text-red-800' :
                goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>{goal.status}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">{goal.esgPillar}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">ESG Goal · {goal.unit}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit2 className="mr-1 h-3 w-3" />Edit</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAiDialog(true)}><MessageSquare className="mr-1 h-3 w-3" />AI</Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Progress" value={`${progressPct}%`} hint={`${goal.currentValue ?? 0} / ${goal.targetValue} ${goal.unit}`} />
        <StatTile label="Remaining" value={`${remaining} ${goal.unit}`} />
        <StatTile label="Linked KPIs" value={kpis?.length ?? 0} />
        <StatTile label="Confidence" value={goal.confidence ?? '-'} hint={`Risk: ${goal.riskLevel ?? 'unknown'}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit/View */}
          {isEditing ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">Edit Goal</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}><X className="h-4 w-4" /> Cancel</Button>
                  <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                  </Button>
                </div>
              </div>
              <form className="space-y-4">
                <Field label="Goal Name" error={errors.name?.message}><Input {...register('name')} /></Field>
                <Field label="Description"><Textarea {...register('description')} rows={3} /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="ESG Pillar">
                    <select {...register('esgPillar')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {ESG_PILLARS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {GOAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Baseline"><Input type="number" {...register('baseline')} /></Field>
                  <Field label="Target" error={errors.targetValue?.message}><Input type="number" {...register('targetValue')} /></Field>
                  <Field label="Unit" error={errors.unit?.message}><Input {...register('unit')} /></Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Current Value"><Input type="number" {...register('currentValue')} /></Field>
                  <Field label="Deadline"><Input type="date" {...register('deadline')} /></Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Confidence">
                    <select {...register('confidence')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </Field>
                  <Field label="Risk Level">
                    <select {...register('riskLevel')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </Field>
                </div>
              </form>
            </Card>
          ) : (
            <>
              {/* Goal Details */}
              <Card className="p-6">
                <h2 className="mb-4 text-base font-semibold">Goal Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Description</p>
                    <p className="mt-1 text-sm">{goal.description || 'No description.'}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>Target: {goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>Current: {goal.currentValue ?? 'N/A'} {goal.unit}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>{goal.ownerId ? `Owner: ${goal.ownerId}` : 'No owner'}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))] mb-1">
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[rgb(var(--muted))]">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            progressPct >= 100 ? 'bg-green-500' : progressPct > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(progressPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Linked KPIs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Linked KPIs ({kpis?.length ?? 0})</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/sustainability/kpis/new?goalId=${id}`}><Plus className="mr-1 h-3 w-3" />Add KPI</Link>
              </Button>
            </div>
            {!kpis?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No KPIs linked to this goal yet.</p>
            ) : (
              <div className="space-y-2">
                {kpis.map((kpi: any) => (
                  <Link key={kpi.id} href={`/dashboard/sustainability/kpis/${kpi.id}`}
                    className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3 hover:bg-[rgb(var(--panel-2))] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{kpi.name}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{kpi.kpiType} · {kpi.frequency}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[rgb(var(--muted))]">Target: {kpi.targetValue ?? '-'} {kpi.unit}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* KPI Trend Chart */}
          {kpiTrend && Array.isArray(kpiTrend) && kpiTrend.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">KPI Trend</h2>
              <LineChart
                data={kpiTrend.map((m: any) => ({
                  label: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short' }),
                  value: m.value,
                }))}
                height={200}
              />
            </Card>
          )}

          {/* Evidence */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Evidence ({evidence?.length ?? 0})</h2>
              <Button variant="outline" size="sm"><Upload className="mr-1 h-3 w-3" />Upload</Button>
            </div>
            {!evidence?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No evidence uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {evidence.map((ev: any) => (
                  <div key={ev.id} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{ev.evidenceType} · v{ev.version}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
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
                {['Explain goal progress', 'Suggest improvements', 'Identify risks', 'Recommend actions'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setAiMessage(prompt)}
                    className="rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors"
                  >{prompt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask about this goal..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()} />
                <Button size="sm" onClick={askAi} disabled={chatMutation.isPending || !aiMessage.trim()}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
              {aiResponse && (
                <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm"><p>{aiResponse}</p></div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[rgb(var(--muted))]" />
                <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[rgb(var(--muted))]" />
                <span>Updated: {new Date(goal.updatedAt).toLocaleDateString()}</span>
              </div>
              {goal.deadline && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>

          {/* SDGs */}
          {goal.linkedSdgs?.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Linked SDGs</h2>
              <div className="flex flex-wrap gap-1.5">
                {goal.linkedSdgs.map((sdg: number) => (
                  <span key={sdg} className="inline-flex items-center rounded-full bg-[rgb(var(--primary))]/10 px-2.5 py-1 text-xs font-medium text-[rgb(var(--primary))]">
                    SDG {sdg}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Goal" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{goal.name}"? This cannot be undone.</p>
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

