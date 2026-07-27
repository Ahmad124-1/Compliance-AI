'use client';

import { useState } from 'react';
import { Settings2, BookOpen, Bot, BarChart3, ListChecks } from 'lucide-react';

import { AiStatusCard } from '@/modules/ai/components/AiStatusCard.js';
import { AiConfigPanel } from '@/modules/ai/components/AiConfigPanel.js';
import { KnowledgeBasePanel } from '@/modules/ai/components/KnowledgeBasePanel.js';
import { AiUsagePanel } from '@/modules/ai/components/AiUsagePanel.js';
import { AiJobsPanel } from '@/modules/ai/components/AiJobsPanel.js';
import { AiChatPanel } from '@/modules/ai/components/AiChatPanel.js';

const TABS = [
  { key: 'settings', label: 'Settings', icon: Settings2 },
  { key: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { key: 'chat', label: 'Assistant', icon: Bot },
  { key: 'usage', label: 'Usage & Cost', icon: BarChart3 },
  { key: 'jobs', label: 'Jobs', icon: ListChecks },
] as const;

export default function AiSettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('settings');

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">AI Settings</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Configure AI providers, models, prompts, and knowledge base</p>
      </div>

      <AiStatusCard />

      <div className="flex flex-wrap gap-1 border-b border-[rgb(var(--border-color))]">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
                tab === t.key
                  ? 'border-[rgb(var(--primary))] font-medium text-[rgb(var(--text))]'
                  : 'border-transparent text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'settings' && <AiConfigPanel />}
      {tab === 'knowledge' && <KnowledgeBasePanel />}
      {tab === 'chat' && <AiChatPanel />}
      {tab === 'usage' && <AiUsagePanel />}
      {tab === 'jobs' && <AiJobsPanel />}
    </div>
  );
}
