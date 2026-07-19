'use client';

import { Cpu } from 'lucide-react';

import { Card } from '@/components/ui/card.js';
import { AiStatusCard } from '@/modules/ai/components/AiStatusCard.js';

const ADAPTERS = [
  { key: 'openai', label: 'OpenAI', note: 'Chat completions API (gpt-4o-mini).' },
  { key: 'gemini', label: 'Google Gemini', note: 'Generative Language API (gemini-1.5-flash).' },
  { key: 'azure', label: 'Azure AI', note: 'Azure OpenAI Service deployments.' },
  { key: 'local', label: 'Local Model', note: 'Self-hosted OpenAI-compatible endpoint.' },
];

export default function AiFoundationPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">AI Foundation</h1>
        <p className="text-xs text-[rgb(var(--muted))]">
          Provider-agnostic architecture: interfaces, factories, dependency injection and future adapter contracts.
          No model inference runs in this build.
        </p>
      </div>

      <AiStatusCard />

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-[rgb(var(--primary))]" />
          <h2 className="text-sm font-semibold">Supported Providers</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ADAPTERS.map((a) => (
            <div key={a.key} className="rounded-lg border border-[rgb(var(--border-color))] p-3">
              <p className="text-sm font-medium text-[rgb(var(--text))]">{a.label}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">{a.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Capability Surface</h2>
        <ul className="grid grid-cols-1 gap-1.5 text-xs text-[rgb(var(--muted))] sm:grid-cols-2">
          <li>• Complaint Categorization</li>
          <li>• Priority Detection</li>
          <li>• Severity Detection</li>
          <li>• Sentiment Analysis</li>
          <li>• Risk Scoring</li>
          <li>• Language Detection</li>
          <li>• Translation</li>
          <li>• Complaint Summarization</li>
          <li>• Duplicate Complaint Detection</li>
          <li>• Framework Mapping</li>
          <li>• Recommendation Engine</li>
        </ul>
      </Card>
    </div>
  );
}
