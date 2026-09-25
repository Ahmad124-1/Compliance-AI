'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, Edit2, Save, X, Loader2, Trash2, Rocket, Calendar, User,
  DollarSign, Target, CheckCircle, Clock, AlertTriangle, MessageSquare,
  FileText, Plus, Trash2 as TrashIcon, Eye, Download, Upload,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/Field';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { BarChart, StatTile } from '@/components/ui/charts';
import { useToast } from '@/providers/ToastProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sustainabilityService } from '@/modules/sustainability/service.js';
import { INITIATIVE_STATUSES, MILESTONE_STATUSES } from '@/modules/sustainability/constants.js';
import { useChat } from '@/modules/ai/hooks.js';

const initEditSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  team: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.coerce.number().positive().nullable().optional(),
  expectedImpact: z.string().optional(),
  actualImpact: z.string().optional(),
  status: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

type InitEditData = z.infer<typeof initEditSchema>;

export default function InitiativeDetailPage() {
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
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', description: '', dueDate: '' });

  const chatMutation = useChat();

  const { data: initiative, isLoading, isError, refetch } = useQuery({
    queryKey: ['sustainability', 'initiative', id],
    queryFn: () => sustainabilityService.getInitiative(id),
  });

  const { data: milestones } = useQuery({
    queryKey: ['sustainability', 'milestones', id],
    queryFn: () => sustainabilityService.listMilestonesByInitiative(id),
    enabled: !!id,
  });

  const { data: evidence } = useQuery({
    queryKey: ['sustainability', 'evidence', { entityType: 'initiative', entityId: id }],
    queryFn: () => sustainabilityService.listEvidenceByEntity('initiative', id),
    enabled: !!id,
  });

  const {
    register, handleSubmit, reset, formState: { errors, isDirty },
  } = useForm<InitEditData>({ resolver: zodResolver(initEditSchema) });

  useEffect(() => {
    if (initiative) {
      reset({
        name: initiative.name, description: initiative.description || '',
        ownerId: initiative.ownerId || '', team: initiative.team || '',
        startDate: initiative.startDate || '', dueDate: initiative.dueDate || '',
        budget: initiative.budget, expectedImpact: initiative.expectedImpact || '',
        actualImpact: initiative.actualImpact || '', status: initiative.status,
        riskLevel: initiative.riskLevel,
      });
    }
  }, [initiative, reset]);

  useEffect(() => { setHasUnsaved(isDirty); }, [isDirty]);

  const updateMutation = useMutation({
    mutationFn: (data: InitEditData) => sustainabilityService.updateInitiative(id, data),
    onSuccess: () => {
      toast({ title: 'Initiative updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'initiative', id] });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'initiatives'] });
      setIsEditing(false); setHasUnsaved(false);
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => sustainabilityService.deleteInitiative(id),
    onSuccess: () => { toast({ title: 'Initiative deleted', variant: 'success' }); router.push('/sustainability/initiatives'); },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'error' }),
  });

  const milestoneMutation = useMutation({
    mutationFn: () => sustainabilityService.createMilestone({
      initiativeId: id, name: newMilestone.name,
      description: newMilestone.description || undefined,
      dueDate: newMilestone.dueDate || undefined,
    }),
    onSuccess: () => {
      toast({ title: 'Milestone added', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sustainability', 'milestones', id] });
      setShowAddMilestone(false);
      setNewMilestone({ name: '', description: '', dueDate: '' });
    },
    onError: (err: Error) => toast({ title: 'Failed', description: err.message, variant: 'error' }),
  });

  const milestoneUpdateMutation = useMutation({
    mutationFn: ({ mId, status }: { mId: string; status: string }) => sustainabilityService.updateMilestone(mId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sustainability', 'milestones', id] }),
  });

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setAiResponse('');
    try {
      const result = await chatMutation.mutateAsync({
        conversationId: `sustainability-initiative-${id}`,
        message: `Regarding the sustainability initiative "${initiative?.name}": ${aiMessage}`,
        useRag: true,
        systemPrompt: 'You are a sustainability AI copilot. Analyze initiative data and provide insights about progress, risks, and recommendations.',
      });
      setAiResponse(result.text);
    } catch { setAiResponse('Failed to get AI response.'); }
  };

  const onSubmit = (data: InitEditData) => updateMutation.mutate(data);

  const getMilestoneStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  if (isError || !initiative) return <ErrorState title="Initiative not found" onRetry={() => refetch()} />;

  const safeMilestones = milestones ?? [];
  const completedMilestones = safeMilestones.filter((m: any) => m.status === 'completed').length;
  const totalMilestones = safeMilestones.length;
  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sustainability/initiatives"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{initiative.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${
                initiative.status === 'completed' ? 'bg-green-100 text-green-800' :
                initiative.status === 'active' ? 'bg-blue-100 text-blue-800' :
                initiative.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                initiative.status === 'planning' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>{initiative.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                initiative.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                initiative.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>{initiative.riskLevel} risk</span>
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">Sustainability Initiative</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit2 className="mr-1 h-3 w-3" />Edit</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(true)}><Plus className="mr-1 h-3 w-3" />Milestone</Button>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatTile label="Milestones" value={`${completedMilestones}/${totalMilestones}`} hint={`${milestoneProgress}% complete`} />
        <StatTile label="Budget" value={initiative.budget ? `$${Number(initiative.budget).toLocaleString()}` : '-'} />
        <StatTile label="Evidence" value={evidence?.length ?? 0} />
        <StatTile label="Due Date" value={initiative.dueDate ? new Date(initiative.dueDate).toLocaleDateString() : '-'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Edit/View */}
          {isEditing ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold">Edit Initiative</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}><X className="h-4 w-4" /> Cancel</Button>
                  <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                  </Button>
                </div>
              </div>
              <form className="space-y-4">
                <Field label="Name" error={errors.name?.message}><Input {...register('name')} /></Field>
                <Field label="Description"><Textarea {...register('description')} rows={2} /></Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status">
                    <select {...register('status')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      {INITIATIVE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Risk Level">
                    <select {...register('riskLevel')} className="h-10 w-full rounded-lg border border-[rgb(var(--border-color))] bg-transparent px-3 text-sm">
                      <option value="low">Low</option><option value="medium">Medium</option>
                      <option value="high">High</option><option value="critical">Critical</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Start Date"><Input type="date" {...register('startDate')} /></Field>
                  <Field label="Due Date"><Input type="date" {...register('dueDate')} /></Field>
                </div>
                <Field label="Team"><Input {...register('team')} /></Field>
                <Field label="Budget"><Input type="number" {...register('budget')} /></Field>
                <Field label="Expected Impact"><Textarea {...register('expectedImpact')} rows={2} /></Field>
                <Field label="Actual Impact"><Textarea {...register('actualImpact')} rows={2} /></Field>
              </form>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="mb-4 text-base font-semibold">Initiative Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Description</p>
                  <p className="mt-1 text-sm">{initiative.description || 'No description.'}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Team: {initiative.team || 'Not assigned'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><DollarSign className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Budget: {initiative.budget ? `$${Number(initiative.budget).toLocaleString()}` : 'Not set'}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-[rgb(var(--muted))]" /><span>{initiative.startDate ? new Date(initiative.startDate).toLocaleDateString() : 'No start'} → {initiative.dueDate ? new Date(initiative.dueDate).toLocaleDateString() : 'No end'}</span></div>
                </div>
              </div>
              {initiative.expectedImpact && (
                <div className="mt-4">
                  <p className="text-xs text-[rgb(var(--muted))] uppercase tracking-wide">Expected Impact</p>
                  <p className="mt-1 text-sm">{initiative.expectedImpact}</p>
                </div>
              )}
            </Card>
          )}

          {/* Milestones */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Milestones ({totalMilestones})</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(true)}>
                <Plus className="mr-1 h-3 w-3" />Add Milestone
              </Button>
            </div>
            {totalMilestones > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))] mb-1">
                  <span>Progress</span>
                  <span>{milestoneProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[rgb(var(--muted))]">
                  <div className="h-2 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${milestoneProgress}%` }} />
                </div>
              </div>
            )}
            {!safeMilestones.length ? (
              <p className="text-sm text-[rgb(var(--muted))]">No milestones yet. Add one to track progress.</p>
            ) : (
              <div className="space-y-2">
                {safeMilestones.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-[rgb(var(--border-color))] p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        m.status === 'completed' ? 'bg-green-500' :
                        m.status === 'overdue' ? 'bg-red-500' :
                        m.status === 'in_progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{m.name}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">{m.description || ''}{m.dueDate ? ` · Due: ${new Date(m.dueDate).toLocaleDateString()}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.status}
                        onChange={(e) => milestoneUpdateMutation.mutate({ mId: m.id, status: e.target.value })}
                        className="h-7 rounded border border-[rgb(var(--border-color))] bg-transparent px-2 text-xs"
                      >
                        {MILESTONE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

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
                {['Summarize progress', 'Assess risks', 'Suggest next steps', 'Evaluate impact'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => setAiMessage(prompt)}
                    className="rounded-full border border-[rgb(var(--border-color))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))] hover:text-[rgb(var(--primary))] transition-colors"
                  >{prompt}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask about this initiative..." value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAi()} />
                <Button size="sm" onClick={askAi} disabled={chatMutation.isPending || !aiMessage.trim()}>
                  {chatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                </Button>
              </div>
              {aiResponse && <div className="rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm"><p>{aiResponse}</p></div>}
            </div>
          </Card>

          {/* Milestone Distribution */}
          {safeMilestones.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-3 text-base font-semibold">Milestone Status</h2>
              <BarChart
                data={MILESTONE_STATUSES.map((s) => ({
                  label: s.label,
                  value: safeMilestones.filter((m: any) => m.status === s.value).length,
                  color: s.value === 'completed' ? 'rgb(34 197 94)' :
                         s.value === 'overdue' ? 'rgb(239 68 68)' :
                         s.value === 'in_progress' ? 'rgb(59 130 246)' :
                         'rgb(156 163 175)',
                })).filter(d => d.value > 0)}
                height={150}
              />
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-3 text-base font-semibold">Timeline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Created: {new Date(initiative.createdAt).toLocaleDateString()}</span></div>
              <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-[rgb(var(--muted))]" /><span>Updated: {new Date(initiative.updatedAt).toLocaleDateString()}</span></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Initiative" size="sm">
        <p className="text-sm text-[rgb(var(--muted))]">Are you sure you want to delete "{initiative.name}"? All milestones will be lost.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
          </Button>
        </div>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={showAddMilestone} onClose={() => setShowAddMilestone(false)} title="Add Milestone" size="sm">
        <div className="space-y-4">
          <Field label="Milestone Name">
            <Input value={newMilestone.name} onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Phase 1 Complete" />
          </Field>
          <Field label="Description">
            <Input value={newMilestone.description} onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))} placeholder="Optional description" />
          </Field>
          <Field label="Due Date">
            <Input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone(prev => ({ ...prev, dueDate: e.target.value }))} />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(false)}>Cancel</Button>
          <Button size="sm" onClick={() => milestoneMutation.mutate()} disabled={!newMilestone.name || milestoneMutation.isPending}>
            {milestoneMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

