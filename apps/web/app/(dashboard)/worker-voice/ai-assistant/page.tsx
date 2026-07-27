'use client';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';

export default function AIWorkerAssistantPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Worker Assistant</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Multilingual assistant for worker rights, policies, benefits, and compliance questions
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[rgb(var(--text))]">Language</label>
            <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm">
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-[rgb(var(--border-color))] bg-[rgb(var(--panel-2))] p-4 text-sm">
            <p className="font-semibold">How can I help you?</p>
            <p className="text-[rgb(var(--muted))]">
              Ask about worker rights, factory policies, leave, overtime, benefits, safety, grievance process, training, compliance, and escalation guidance.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex h-10 w-full rounded-md border border-[rgb(var(--border-color))] bg-transparent px-3 py-2 text-sm shadow-none outline-none ring-offset-background placeholder:text-[rgb(var(--muted))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
            />
            <Button>Send</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
