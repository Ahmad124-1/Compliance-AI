'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Edit2, Save, X, Loader2, Trash2, Play, Pause, Archive,
  Calendar, User, DollarSign, Target, Activity, FileText, MessageSquare,
  Upload, Download, Clock, AlertTriangle, BarChart3, TrendingUp,
  CheckCircle, XCircle, HelpCircle, Plus, Eye, History,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { BarChart, DonutChart, LineChart, StatTile } from '@/components/ui/charts';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { PROGRAM_CATEGORIES, PROGRAM_STATUSES, ESG_PILLARS } from '@/modules/sustainability/constants.js';
import { useChat } from '@/modules/ai/hooks.js';

const programEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  ownerId: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().positive().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.string().optional(),
});

type ProgramEditData = z.infer<typeof programEditSchema>;

export default function ProgramDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const chatMutation = useChat();

  const { data: program, isLoading, isError, refetch } = useQuery({
    queryKey: ['sustainability', 'program', id],
    queryFn: () => sustainabilityService.getProgram(id),
  });

  const { data: goals } = useQuery({
    queryKey: ['sustainability', 'goals', { programId: id }],
    queryFn: () => sustainabilityService.listGoals({ programId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: initiatives } = useQuery({
    queryKey: ['sustainability', 'initiatives', { programId: id }],
    queryFn: () => sustainabilityService.listInitiatives({ programId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: kpis } = useQuery({
    queryKey: ['sustainability', 'kpis', { programId: id }],
    queryFn: () => sustainabilityService.listKpis({ programId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['sustainability', 'evidence', { entityType: 'program', entityId: id }],
    queryFn: () => sustainabilityService.listEvidenceByEntity('program', id),
    enabled: !!id,
  });

  const { data: programProgress } = useQuery({
    queryKey: ['sustainability', 'analytics', 'progress', id],
    queryFn: () => sustainabilityService.getProgramProgress(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProgramEditData>({
    resolver: zodResolver(programEditSchema),
  });

  useEffect(() => {
    if (program) {
      reset({
        name: program.name,
        description: program.description || '',
        category: program.category,
        ownerId: program.ownerId || '',
        departmentId: program.departmentId || '',
        startDate: program.startDate || '',
        endDate: program.endDate || '',
        budget: program.budget,
        priority: program.priority,
        status: program.status,
      });
    }
  }, [program, reset]);

  useEffect(() => {
    setHasUnsaved(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsaved]);

  const updateMutation = useMutation({
    mutationFn: (data: ProgramEditData) => sustainabilityService.updateProgram(id, data),
    onSuccess: () => {
      toast({ title: 'Program updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'program', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] });
      setIsEditing(false);
      setHasUnsaved(false);
    },
    onError: (err: Error) => {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => sustainabilityService.deleteProgram(id),
    onSuccess: () => {
      toast({ title: 'Program deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] });
      router.push('/dashboard/sustainability/programs');
    },
    onError: (err: Error) => {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => sustainabilityService.updateProgram(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'program', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'programs'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
  });

  const evidenceMutation = useMutation({
    mutationFn: async () => {
      if (!evidenceFile) throw new Error('No file selected');
      return sustainabilityService.createEvidence({
        entityType: 'program',
        entityId: id,
        title: evidenceFile.name,
        evidenceType: 'other',
        tags: [],
      });
    },
    onSuccess: () => {
      toast({ title: 'Evidence uploaded', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'evidence'] });
      setShowEvidenceDialog(false);
      setEvidenceFile(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Upload failed', description: err.message, variant: 'error' });
    },
  });

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setAiResponse('');
    try {
      const result = await chatMutation.mutateAsync({
        conversationId: `sustainability-program-${id}`,
        message: `Regarding the sustainability program "${program?.name}": ${aiMessage}`,
        useRag: true,
        systemPrompt: 'You are a sustainability AI copilot. Analyze the program data and provide insights about sustainability performance, risks, and recommendations.',
      });
      setAiResponse(result.text);
    } catch (err: any) {
      setAiResponse('Failed to get AI response. Please try again.');
    }
  };

  const onSubmit = (data: ProgramEditData) => {
    updateMutation.mutate(data);
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const priorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <ErrorState
        title="Program not found"
        message="The program you're looking for doesn't exist or you don't have access."
        onRetry={() => refetch()}
      />
    );
  }

  const goalProgress = goals?.length
    ? {
        achieved: goals.filter((g: any) => g.status === 'achieved').length,
        inProgress: goals.filter((g: any) => g.status === 'in_progress').length,
        atRisk: goals.filter((g: any) => g.status === 'at_risk').length,
        notStarted: goals.filter((g: any) => g.status === 'not_started').length,
      }
    : null;

  const initiativeStats = initiatives?.length
    ? {
        completed: initiatives.filter((i: any) => i.status === 'completed').length,
        active: initiatives.filter((i: any) => i.status === 'active').length,
        planning: initiatives.filter((i: any) => i.status === 'planning').length,
        onHold: initiatives.filter((i: any) => i.status === 'on_hold').length,
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/sustainability/programs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{program.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColor(program.status)}`}>{program.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${priorityColor(program.priority)}`}>{program.priority}</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{program.category?.replace(/_/g, ' ')} Program</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-1 h-3 w-3" />Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAiDialog(true)}>
                <MessageSquare className="mr-1 h-3 w-3" />AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEvidenceDialog(true)}>
                <Upload className="mr-1 h-3 w-3" />Evidence
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="mr-1 h-3 w-3" />Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Goals" value={goals?.length ?? 0} hint={`${goalProgress?.achieved ?? 0} achieved`} />
        <StatTile label="Initiatives" value={initiatives?.length ?? 0} hint={`${initiativeStats?.active ?? 0} active`} />
        <StatTile label="KPIs" value={kpis?.length ?? 0} />
        <StatTile label="Evidence" value={evidence?.length ?? 0} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Form or View Mode */}
          {isEditing ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">Edit Program</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}>
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </div>
              <form className="space-y-4">
                <Field label="Program Name" error={errors.name?.message}>
                  <Input {...register('name')} />
                </Field>
                <Field label="Description">
                  <Textarea {...register('description')} rows={3} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Category" error={errors.category?.message}>
                    <select {...register('category')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PROGRAM_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select {...register('priority')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Start Date">
                    <Input type="date" {...register('startDate')} />
                  </Field>
                  <Field label="End Date">
                    <Input type="date" {...register('endDate')} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Budget">
                    <Input type="number" step="0.01" {...register('budget')} />
                  </Field>
                  <Field label="Status">
                    <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {PROGRAM_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </form>
            </Card>
          ) : (
            <>
              {/* Program Details */}
              <Card className="p-6">
                <h2 className="mb-4 text-base font-semibold">Program Details</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Description</p>
                    <p className="mt-1 text-sm">{program.description || 'No description provided.'}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>{program.startDate ? new Date(program.startDate).toLocaleDateString() : 'No start date'}</span>
                      <span className="text-[rgb(var(--muted))]">→</span>
                      <span>{program.endDate ? new Date(program.endDate).toLocaleDateString() : 'No end date'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>{program.budget ? `$${Number(program.budget).toLocaleString()}` : 'No budget set'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <span>{program.ownerId ? `Owner: ${program.ownerId}` : 'No owner assigned'}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h2 className="mb-3 text-base font-semibold">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => statusMutation.mutate(program.status === 'active' ? 'paused' : 'active')}>
                    {program.status === 'active' ? <Pause className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}
                    {program.status === 'active' ? 'Pause' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/sustainability/goals/new?programId=${id}`}>
                      <Plus className="mr-1 h-3 w-3" />Add Goal
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/sustainability/initiatives/new?programId=${id}`}>
                      <Plus className="mr-1 h-3 w-3" />Add Initiative
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/sustainability/kpis/new?programId=${id}`}>
                      <Plus className="mr-1 h-3 w-3" />Add KPI
                    </Link>
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Goals Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Linked Goals ({goals?.length ?? 0})</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/sustainability/goals/new?programId=${id}`}>
                  <Plus className="mr-1 h-3 w-3" />Add Goal
                </Link>
              </Button>
            </div>
            {!goals?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No goals linked to this program yet.</p>
            ) : (
              <div className="space-y-2">
                {goals.map((goal: any) => (
                  <Link key={goal.id} href={`/dashboard/sustainability/goals/${goal.id}`}
                    className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3 hover:bg-[rgb(var(--panel-2))] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{goal.name}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{goal.esgPillar} · {goal.progressPct}% complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-[rgb(var(--muted))]">
                        <div className="h-1.5 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${goal.progressPct}%` }} />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        goal.status === 'achieved' ? 'bg-green-100 text-green-800' :
                        goal.status === 'at_risk' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>{goal.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Initiatives Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Linked Initiatives ({initiatives?.length ?? 0})</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/sustainability/initiatives/new?programId=${id}`}>
                  <Plus className="mr-1 h-3 w-3" />Add Initiative
                </Link>
              </Button>
            </div>
            {!initiatives?.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No initiatives linked to this program yet.</p>
            ) : (
              <div className="space-y-2">
                {initiatives.map((init: any) => (
                  <Link key={init.id} href={`/dashboard/sustainability/initiatives/${init.id}`}
                    className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3 hover:bg-[rgb(var(--panel-2))] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-[rgb(var(--muted))]" />
                      <div>
                        <p className="text-sm font-medium">{init.name}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{init.milestonesCount} milestones · Due: {init.dueDate ? new Date(init.dueDate).toLocaleDateString() : 'No due date'}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      init.status === 'completed' ? 'bg-green-100 text-green-800' :
                      init.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      init.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{init.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Evidence Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Evidence ({evidence?.length ?? 0})</h2>
              <Button variant="outline" size="sm" onClick={() => setShowEvidenceDialog(true)}>
                <Upload className="mr-1 h-3 w-3" />Upload
              </Button>
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
                        <p className="text-xs text-[rgb(var(--muted))]">{ev.evidenceType} · v{ev.version} · {new Date(ev.createdAt).toLocaleDateString()}</p>
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
                {['Summarize performance', 'Identify risks', 'Suggest improvements', 'Generate report'].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setAiMessage(prompt)}
                    className="rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about this program..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()}
                />
                <Button size="sm" onClick={askAi} disabled={chatMutation.isPending || !aiMessage.trim()}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
              {aiResponse && (
                <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm">
                  <p>{aiResponse}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Charts */}
          {goalProgress && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Goal Status Distribution</h2>
              <DonutChart
                data={[
                  { label: 'Achieved', value: goalProgress.achieved, color: 'rgb(34 197 94)' },
                  { label: 'In Progress', value: goalProgress.inProgress, color: 'rgb(59 130 246)' },
                  { label: 'At Risk', value: goalProgress.atRisk, color: 'rgb(239 68 68)' },
                  { label: 'Not Started', value: goalProgress.notStarted, color: 'rgb(156 163 175)' },
                ]}
                size={160}
              />
            </Card>
          )}

          {initiativeStats && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Initiative Status</h2>
              <BarChart
                data={[
                  { label: 'Completed', value: initiativeStats.completed, color: 'rgb(34 197 94)' },
                  { label: 'Active', value: initiativeStats.active, color: 'rgb(59 130 246)' },
                  { label: 'Planning', value: initiativeStats.planning, color: 'rgb(156 163 175)' },
                  { label: 'On Hold', value: initiativeStats.onHold, color: 'rgb(245 158 11)' },
                ]}
                height={180}
              />
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[rgb(var(--muted))]" />
                <span>Created: {new Date(program.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[rgb(var(--muted))]" />
                <span>Updated: {new Date(program.updatedAt).toLocaleDateString()}</span>
              </div>
              {program.startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>Start: {new Date(program.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {program.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-[rgb(var(--muted))]" />
                  <span>End: {new Date(program.endDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>

          {/* SDGs */}
          {program.linkedSdgs?.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Linked SDGs</h2>
              <div className="flex flex-wrap gap-1.5">
                {program.linkedSdgs.map((sdg: number) => (
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
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Program" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">
          Are you sure you want to delete "{program.name}"? This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        </div>
      </Dialog>

      {/* Evidence Upload Dialog */}
      <Dialog open={showEvidenceDialog} onClose={() => setShowEvidenceDialog(false)} title="Upload Evidence" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[rgb(var(--muted))]">Upload evidence documents, certificates, or photos for this program.</p>
          <div className="rounded-lg border-2 border-dashed border-[rgb(var(--border-color))] p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-[rgb(var(--muted))]" />
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Drop files here or click to browse</p>
            <input
              type="file"
              className="mt-2 text-sm"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            />
          </div>
          {evidenceFile && (
            <p className="text-sm">Selected: {evidenceFile.name}</p>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEvidenceDialog(false)}>Cancel</Button>
          <Button size="sm" onClick={() => evidenceMutation.mutate()} disabled={!evidenceFile || evidenceMutation.isPending}>
            {evidenceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

