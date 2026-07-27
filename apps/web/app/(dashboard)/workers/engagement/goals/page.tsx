'use client';

import { useState } from 'react';

import { Card } from '@/components/ui/card.js';
import { EmptyState } from '@/components/ui';
import { useCreatePost } from '@/modules/engagement/store.js';
import { Target, Tag } from 'lucide-react';

export default function GoalsPage() {
  const { mutateAsync: createPost } = useCreatePost();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [goalType, setGoalType] = useState('personal');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Goals & Development</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Set and track your professional goals</p>
      </div>

      <Card className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">Goal Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" placeholder="Improve communication skills" />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="mt-1 rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-3 py-2 text-sm">
            <option value="personal">Personal</option>
            <option value="team">Team</option>
            <option value="career">Career</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Skills</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full bg-[rgb(var(--panel-2))] px-2 py-0.5 text-xs">
                <Tag className="h-3 w-3" /> {s}
              </span>
            ))}
            <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && skillInput.trim()) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); } }} className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--input-bg))] px-2 py-0.5 text-xs" placeholder="Add skill + Enter" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={() => { if (title.trim()) { createPost({ postType: 'goal', title, body: description, category: goalType }); setTitle(''); setDescription(''); setSkills([]); } }} className="flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm text-[rgb(var(--primary-foreground))] hover:opacity-90">
            <Target className="h-4 w-4" /> Add Goal
          </button>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Your Goals</h2>
        <EmptyState title="No goals yet" description="Add your first professional goal above." />
      </Card>
    </div>
  );
}
