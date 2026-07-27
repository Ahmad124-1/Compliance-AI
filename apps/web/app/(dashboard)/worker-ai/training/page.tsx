'use client';

import { useState, useCallback } from 'react';
import { GraduationCap, Loader2, Award, BookOpen } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Skeleton } from '@/components/ui/Skeleton.js';
import { useTrainingRecommendations, useTrainingProgress, useTrainingQuiz } from '@/modules/worker-ai/store.js';

export default function WorkerAiTrainingPage() {
  const { data: recommendations, isLoading: recLoading } = useTrainingRecommendations();
  const { data: progress, isLoading: progLoading } = useTrainingProgress();
  const { mutate: generateQuiz, data: quiz } = useTrainingQuiz();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('easy');

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    generateQuiz({ topic: topic.trim(), difficulty: difficulty as any, count: 5 });
  }, [topic, difficulty, generateQuiz]);

  const loading = recLoading || progLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Training Assistant</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Get training recommendations, explain concepts, generate quizzes, and track progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[rgb(var(--primary))]" />
            <h3 className="text-sm font-semibold">Completion</h3>
          </div>
          {loading ? <Skeleton className="mt-2 h-6 w-16" /> : (
            <p className="mt-2 text-2xl font-bold">{progress?.overallProgress ?? 0}%</p>
          )}
          {loading ? <Skeleton className="mt-1 h-4 w-24" /> : (
            <p className="text-xs text-[rgb(var(--muted))]">{progress?.completed ?? 0} of {progress?.total ?? 0} completed</p>
          )}
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[rgb(var(--primary))]" />
            <h3 className="text-sm font-semibold">Upcoming</h3>
          </div>
          {loading ? <Skeleton className="mt-2 h-6 w-16" /> : (
            <p className="mt-2 text-2xl font-bold">{recommendations?.length ?? 0}</p>
          )}
          {loading ? <Skeleton className="mt-1 h-4 w-24" /> : (
            <p className="text-xs text-[rgb(var(--muted))]">Trainings in progress</p>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Generate Practice Quiz</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs text-[rgb(var(--muted))]">Topic</label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Machine Safety" />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm w-32"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <Button onClick={handleGenerate} disabled={!topic.trim() || (generateQuiz as any).isPending}>
            {(generateQuiz as any).isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
            Generate
          </Button>
        </div>
      </Card>

      {quiz && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Quiz: {quiz.topic}</h2>
          <div className="space-y-3">
            {quiz.questions.map((q, idx) => (
              <div key={idx} className="rounded-md border border-[rgb(var(--border-color))] p-3">
                <p className="text-sm font-medium">{q.question}</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 rounded-md bg-[rgb(var(--panel-2))] p-2 text-xs">
                      <input type="radio" name={`q_${idx}`} value={opt} className="accent-[rgb(var(--primary))]" />
                      <span className="truncate">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Recommended Training</h2>
        <div className="space-y-2">
          {(recommendations ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel))] p-2">
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{r.type} · {(r.progress ?? 0)}%</p>
              </div>
              <span className="h-2 w-24 rounded-full bg-[rgb(var(--panel-2))]">
                <span className="block h-2 rounded-full bg-[rgb(var(--primary))]" style={{ width: `${r.progress ?? 0}%` }} />
              </span>
            </div>
          ))}
          {!recLoading && (recommendations ?? []).length === 0 && (
            <p className="text-sm text-[rgb(var(--muted))]">No pending trainings.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
