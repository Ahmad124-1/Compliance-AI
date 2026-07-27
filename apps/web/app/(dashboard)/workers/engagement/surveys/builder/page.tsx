'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { useCreateSurvey } from '@/modules/engagement/store.js';
import { ENGAGEMENT_ROUTES } from '@/modules/engagement/constants.js';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SurveyBuilderPage() {
  const { mutateAsync: createSurvey, isLoading } = useCreateSurvey();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const addQuestion = () => setQuestions([...questions, '']);
  const removeQuestion = (index: number) => setQuestions(questions.filter((_, i) => i !== index));
  const updateQuestion = (index: number, value: string) => {
    const next = [...questions];
    next[index] = value;
    setQuestions(next);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    const filteredQuestions = questions.filter((q) => q.trim());
    await createSurvey({
      title,
      description,
      surveyType: 'pulse',
      status: 'active',
      questions: filteredQuestions.map((q) => ({ id: `q_${Date.now()}_${Math.random().toString(36).slice(2,5)}`, text: q, type: 'text' })),
      isAnonymous,
      isRecurring: false,
      language: 'en',
    });
    window.location.href = ENGAGEMENT_ROUTES.surveys;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={ENGAGEMENT_ROUTES.surveys}>
          <button className="rounded-md border border-[rgb(var(--border-color))] p-2 hover:bg-[rgb(var(--panel-2))]">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Survey Builder</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Design your pulse survey</p>
        </div>
      </div>

      <Card className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" placeholder="How satisfied are you today?" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" placeholder="Tell workers what this survey is about." />
        </div>
        <div className="flex items-center gap-2">
          <input id="anon" type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          <label htmlFor="anon" className="text-sm">Anonymous</label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Questions</label>
            <Button variant="subtle" size="sm" onClick={addQuestion}><Plus className="h-4 w-4" /> Add Question</Button>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input value={q} onChange={(e) => updateQuestion(i, e.target.value)} className="flex-1 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" placeholder={`Question ${i + 1}`} />
              <Button variant="outline" size="sm" onClick={() => removeQuestion(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Link href={ENGAGEMENT_ROUTES.surveys}><Button variant="outline">Cancel</Button></Link>
          <Button onClick={handleCreate} disabled={isLoading || !title.trim()}>Create Survey</Button>
        </div>
      </Card>
    </div>
  );
}
