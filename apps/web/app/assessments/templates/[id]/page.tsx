'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, GripVertical, ListChecks, Layers, Save, Settings2, Network,
} from 'lucide-react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Input } from '@/components/ui/input.js';
import { Textarea } from '@/components/ui/textarea.js';
import { Field } from '@/components/ui/Field.js';
import { Dialog } from '@/components/ui/Dialog.js';
import { EmptyState } from '@/components/ui/states.js';
import { useAuth } from '@/providers/AuthProvider.js';
import {
  useTemplateStructure, useUpdateTemplate,
  useCreateSection, useUpdateSection, useDeleteSection,
  useCreateQuestion, useUpdateQuestion, useSetQuestionOptions,
  useFrameworkMappings, useSetFrameworkMappings,
} from '@/modules/assessments/module.store.js';
import {
  ANSWER_TYPE_LABELS, type AnswerTypeKey, type AssessmentSection, type AssessmentQuestion,
  type AssessmentAnswerOption, type AssessmentTemplate,
} from '@/modules/assessments/module.types.js';

const ANSWER_TYPES = Object.keys(ANSWER_TYPE_LABELS) as AnswerTypeKey[];

interface SectionDraft { id?: string; title: string; description: string; guidance: string; weight: number }
interface QuestionDraft {
  id?: string; sectionId: string; label: string; helpText: string; answerTypeKey: AnswerTypeKey;
  isRequired: boolean; weight: number; options: AssessmentAnswerOption[];
}

function blankSection(): SectionDraft {
  return { title: '', description: '', guidance: '', weight: 1 };
}
function blankQuestion(sectionId: string): QuestionDraft {
  return {
    sectionId, label: '', helpText: '', answerTypeKey: 'short_text', isRequired: true, weight: 1,
    options: [
      { id: crypto.randomUUID(), questionId: '', label: 'Option 1', value: 'option_1', position: 0, score: 0, description: null, isDefault: false, conditionalLogic: null, metadata: {} },
      { id: crypto.randomUUID(), questionId: '', label: 'Option 2', value: 'option_2', position: 1, score: 0, description: null, isDefault: false, conditionalLogic: null, metadata: {} },
    ],
  };
}

export default function TemplateBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('assessment:update');

  const { data: structure, isLoading } = useTemplateStructure(id);
  const updateTemplate = useUpdateTemplate();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const setQuestionOptions = useSetQuestionOptions();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(blankSection());
  const [editSectionId, setEditSectionId] = useState<string | null>(null);

  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>(blankQuestion(''));
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);

  const [mappingsOpen, setMappingsOpen] = useState(false);
  const [mappingsTarget, setMappingsTarget] = useState<string | null>(null);
  const [mappingsDraft, setMappingsDraft] = useState<Record<string, unknown>[]>([]);

  const { data: fwMappings } = useFrameworkMappings(id);
  const setFrameworkMappings = useSetFrameworkMappings();

  const openFrameworkMappings = (qid: string) => {
    setMappingsTarget(qid);
    setMappingsDraft((fwMappings ?? []).filter((m) => m.questionId === qid || !m.questionId).map((m) => ({ ...m })) as Record<string, unknown>[]);
    setMappingsOpen(true);
  };

  const saveMappings = async () => {
    if (!mappingsTarget) return;
    const next = mappingsDraft.map((m, i) => ({ ...m, id: m.id ?? crypto.randomUUID(), position: i }));
    await setFrameworkMappings.mutateAsync({ templateId: id, qid: mappingsTarget, mappings: next });
    setMappingsOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading builder…</p>;
  if (!structure) return <EmptyState title="Template not found" description="This template may have been deleted." />;

  const template = structure.template as AssessmentTemplate;
  const sections = structure.sections as AssessmentSection[];
  const questions = structure.questions as AssessmentQuestion[];

  const openNewSection = () => { setEditSectionId(null); setSectionDraft(blankSection()); setSectionOpen(true); };
  const openEditSection = (s: AssessmentSection) => {
    setEditSectionId(s.id);
    setSectionDraft({ id: s.id, title: s.title, description: s.description ?? '', guidance: s.guidance ?? '', weight: s.weight });
    setSectionOpen(true);
  };

  const saveSection = async () => {
    if (!sectionDraft.title.trim()) return;
    if (editSectionId) {
      await updateSection.mutateAsync({ id: editSectionId, templateId: id, dto: { title: sectionDraft.title, description: sectionDraft.description, guidance: sectionDraft.guidance, weight: sectionDraft.weight } });
    } else {
      await createSection.mutateAsync({ templateId: id, dto: { title: sectionDraft.title, description: sectionDraft.description, guidance: sectionDraft.guidance, weight: sectionDraft.weight, position: sections.length } });
    }
    setSectionOpen(false);
  };

  const openNewQuestion = (sectionId: string) => { setEditQuestionId(null); setQuestionDraft(blankQuestion(sectionId)); setQuestionOpen(true); };
  const openEditQuestion = (q: AssessmentQuestion) => {
    setEditQuestionId(q.id);
    setQuestionDraft({
      id: q.id, sectionId: q.sectionId ?? '', label: q.label, helpText: q.helpText ?? '', answerTypeKey: q.answerTypeKey,
      isRequired: q.isRequired, weight: q.weight, options: q.options ?? [],
    });
    setQuestionOpen(true);
  };

  const saveQuestion = async () => {
    if (!questionDraft.label.trim()) return;
    const hasOptions = ['dropdown', 'multiselect', 'radio', 'checkbox', 'yes_no', 'pass_fail'].includes(questionDraft.answerTypeKey);
    const dto: Record<string, unknown> = {
      label: questionDraft.label, helpText: questionDraft.helpText, sectionId: questionDraft.sectionId,
      answerTypeKey: questionDraft.answerTypeKey, isRequired: questionDraft.isRequired, weight: questionDraft.weight,
      position: questions.length,
    };
    let qid: string;
    if (editQuestionId) {
      await updateQuestion.mutateAsync({ id: editQuestionId, templateId: id, dto });
      qid = editQuestionId;
    } else {
      const created = await createQuestion.mutateAsync({ templateId: id, dto });
      qid = created.id;
    }
    if (hasOptions) {
      const opts = questionDraft.options.map((o, i) => ({ ...o, questionId: qid, position: i }));
      await setQuestionOptions.mutateAsync({ id: qid, templateId: id, options: opts });
    }
    setQuestionOpen(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/assessments/templates"><Button size="sm" variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-semibold">{template.title}</h1>
            <p className="text-xs text-[rgb(var(--muted))]">Checklist Builder · v{template.version} · {template.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)}><Settings2 className="h-4 w-4" /> Settings</Button>}
          {canEdit && <Button size="sm" onClick={openNewSection}><Plus className="h-4 w-4" /> Section</Button>}
        </div>
      </div>

      {sections.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Layers className="h-8 w-8" />}
            title="No sections yet"
            description="Add a section to start building your checklist. Sections group related questions."
            action={canEdit ? <Button size="sm" onClick={openNewSection}><Plus className="h-4 w-4" /> Add Section</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((s) => {
            const qs = questions.filter((q) => (q.sectionId ?? '') === s.id).sort((a, b) => a.position - b.position);
            return (
              <Card key={s.id} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[rgb(var(--border-color))] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[rgb(var(--primary))]" />
                    <div>
                      <p className="text-sm font-semibold">{s.title}</p>
                      {s.description && <p className="text-xs text-[rgb(var(--muted))]">{s.description}</p>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openNewQuestion(s.id)}><Plus className="h-4 w-4" /> Question</Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditSection(s)}><Settings2 className="h-4 w-4" /></Button>
                      <DeleteSectionButton onDelete={() => deleteSection.mutateAsync({ id: s.id, templateId: id })} label="section" />
                    </div>
                  )}
                </div>
                <div className="divide-y divide-[rgb(var(--border-color))]">
                  {qs.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-[rgb(var(--muted))]">No questions in this section.</p>
                  ) : (
                    qs.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => canEdit && openEditQuestion(q)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--panel-2))] disabled:hover:bg-transparent"
                      >
                        <GripVertical className="h-4 w-4 text-[rgb(var(--muted-2))]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.label}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">
                            {ANSWER_TYPE_LABELS[q.answerTypeKey]} {q.isRequired ? '· required' : ''} {q.weight !== 1 ? `· weight ${q.weight}` : ''}
                          </p>
                        </div>
                        {q.options && q.options.length > 0 && <span className="text-xs text-[rgb(var(--muted))]">{q.options.length} options</span>}
                        {canEdit && (
                          <span className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openFrameworkMappings(q.id); }}><Network className="h-4 w-4" /></Button>
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Section dialog */}
      <Dialog open={sectionOpen} onClose={() => setSectionOpen(false)} title={editSectionId ? 'Edit Section' : 'New Section'}>
        <Field label="Title">
          <Input value={sectionDraft.title} onChange={(e) => setSectionDraft({ ...sectionDraft, title: e.target.value })} placeholder="e.g. Health & Safety" />
        </Field>
        <Field label="Description" className="mt-3">
          <Textarea value={sectionDraft.description} onChange={(e) => setSectionDraft({ ...sectionDraft, description: e.target.value })} />
        </Field>
        <Field label="Guidance" className="mt-3">
          <Textarea value={sectionDraft.guidance} onChange={(e) => setSectionDraft({ ...sectionDraft, guidance: e.target.value })} />
        </Field>
        <Field label="Weight" className="mt-3">
          <Input type="number" value={sectionDraft.weight} onChange={(e) => setSectionDraft({ ...sectionDraft, weight: Number(e.target.value) })} />
        </Field>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={saveSection}><Save className="h-4 w-4" /> {editSectionId ? 'Save' : 'Add'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setSectionOpen(false)}>Cancel</Button>
        </div>
      </Dialog>

      {/* Question dialog */}
      <Dialog open={questionOpen} onClose={() => setQuestionOpen(false)} title={editQuestionId ? 'Edit Question' : 'New Question'} size="lg">
        <Field label="Question">
          <Textarea value={questionDraft.label} onChange={(e) => setQuestionDraft({ ...questionDraft, label: e.target.value })} placeholder="e.g. Are fire extinguishers inspected monthly?" />
        </Field>
        <Field label="Help text" className="mt-3">
          <Input value={questionDraft.helpText} onChange={(e) => setQuestionDraft({ ...questionDraft, helpText: e.target.value })} />
        </Field>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Answer type">
            <select
              className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm"
              value={questionDraft.answerTypeKey}
              onChange={(e) => setQuestionDraft({ ...questionDraft, answerTypeKey: e.target.value as AnswerTypeKey })}
            >
              {ANSWER_TYPES.map((a) => <option key={a} value={a}>{ANSWER_TYPE_LABELS[a]}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select
              className="h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm"
              value={questionDraft.sectionId}
              onChange={(e) => setQuestionDraft({ ...questionDraft, sectionId: e.target.value })}
            >
              {sections.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={questionDraft.isRequired} onChange={(e) => setQuestionDraft({ ...questionDraft, isRequired: e.target.checked })} />
            Required
          </label>
          <Field label="Weight">
            <Input className="w-24" type="number" value={questionDraft.weight} onChange={(e) => setQuestionDraft({ ...questionDraft, weight: Number(e.target.value) })} />
          </Field>
        </div>

        {['dropdown', 'multiselect', 'radio', 'checkbox', 'yes_no', 'pass_fail'].includes(questionDraft.answerTypeKey) && (
          <div className="mt-4 rounded-md border border-[rgb(var(--border-color))] p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium"><ListChecks className="h-4 w-4" /> Answer options</p>
            <div className="space-y-2">
              {questionDraft.options.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Input value={o.label} onChange={(e) => {
                    const next = [...questionDraft.options];
                    next[i] = { ...o, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                    setQuestionDraft({ ...questionDraft, options: next });
                  }} placeholder={`Option ${i + 1}`} />
                  <Input className="w-20" type="number" value={o.score} onChange={(e) => {
                    const next = [...questionDraft.options];
                    next[i] = { ...o, score: Number(e.target.value) };
                    setQuestionDraft({ ...questionDraft, options: next });
                  }} title="Score" />
                  <Button size="sm" variant="ghost" onClick={() => setQuestionDraft({ ...questionDraft, options: questionDraft.options.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setQuestionDraft({
              ...questionDraft, options: [...questionDraft.options, {
                id: crypto.randomUUID(), questionId: '', label: '', value: '', position: questionDraft.options.length,
                score: 0, description: null, isDefault: false, conditionalLogic: null, metadata: {},
              }],
            })}><Plus className="h-4 w-4" /> Add option</Button>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={saveQuestion}><Save className="h-4 w-4" /> {editQuestionId ? 'Save' : 'Add'}</Button>
          <Button size="sm" variant="ghost" onClick={() => setQuestionOpen(false)}>Cancel</Button>
        </div>
      </Dialog>

      {/* Template settings dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Template Settings">
        <Field label="Title">
          <Input defaultValue={template.title} id="tmpl-title" />
        </Field>
        <Field label="Description" className="mt-3">
          <Textarea defaultValue={template.description ?? ''} id="tmpl-desc" />
        </Field>
        <Field label="Instructions" className="mt-3">
          <Textarea defaultValue={template.instructions ?? ''} id="tmpl-instr" />
        </Field>
        <Field label="Estimated duration (minutes)" className="mt-3">
          <Input type="number" defaultValue={template.estimatedDurationMinutes ?? ''} id="tmpl-dur" />
        </Field>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={() => {
            const title = (document.getElementById('tmpl-title') as HTMLInputElement)?.value ?? template.title;
            const description = (document.getElementById('tmpl-desc') as HTMLTextAreaElement)?.value ?? '';
            const instructions = (document.getElementById('tmpl-instr') as HTMLTextAreaElement)?.value ?? '';
            const dur = (document.getElementById('tmpl-dur') as HTMLInputElement)?.value;
            updateTemplate.mutateAsync({ id, dto: { title, description, instructions, estimatedDurationMinutes: dur ? Number(dur) : null } });
            setSettingsOpen(false);
          }}><Save className="h-4 w-4" /> Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(false)}>Cancel</Button>
        </div>
      </Dialog>

      {/* Mappings dialog */}
      <Dialog open={mappingsOpen} onClose={() => setMappingsOpen(false)} title="Framework Mappings">
        <div className="space-y-2">
          {mappingsDraft.map((m, i) => (
            <div key={String(m.id ?? i)} className="grid grid-cols-2 gap-2">
              <Input value={String(m.clauseCode ?? '')} onChange={(e) => {
                const next = [...mappingsDraft]; next[i] = { ...m, clauseCode: e.target.value }; setMappingsDraft(next);
              }} placeholder="Clause code" />
              <Input value={String(m.mappingStrength ?? '')} onChange={(e) => {
                const next = [...mappingsDraft]; next[i] = { ...m, mappingStrength: e.target.value }; setMappingsDraft(next);
              }} placeholder="Mapping strength" />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => setMappingsDraft([...mappingsDraft, { id: crypto.randomUUID(), mappingStrength: 'direct' }])}>Add mapping</Button>
        </div>
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={saveMappings}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setMappingsOpen(false)}>Cancel</Button>
        </div>
      </Dialog>
    </div>
  );
}

function DeleteSectionButton({ onDelete, label }: { onDelete: () => void; label: string }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="text-[rgb(var(--danger))]" onClick={onDelete}>Confirm</Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
      </span>
    );
  }
  return <Button size="sm" variant="ghost" title={`Delete ${label}`} onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /></Button>;
}
