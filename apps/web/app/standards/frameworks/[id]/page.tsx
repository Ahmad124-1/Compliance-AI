'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import {
  useFramework,
  useClauseTree,
  useRequirements,
  useControlsForRequirement,
  useFrameworkProgress,
  useSetControlStatus,
} from '@/modules/standards/module.store.js';
import type { Clause, Requirement, Control, FrameworkProgress, ControlStatusState } from '@/modules/standards/module.types.js';

export default function FrameworkDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: framework, isLoading } = useFramework(id);
  const { data: clauses } = useClauseTree(id);
  const { data: requirements } = useRequirements(id);
  const { data: progress } = useFrameworkProgress(id);
  const [tab, setTab] = useState<'tree' | 'requirements' | 'progress'>('tree');

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;
  if (!framework) return <p className="text-sm text-[rgb(var(--muted))]">Framework not found.</p>;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{framework.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">v{framework.version} · {framework.status}</p>
      </div>

      <div className="mb-4 flex gap-2">
        {(['tree', 'requirements', 'progress'] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === 'tree' && (
        <Card className="p-4">
          <ClauseTree clauses={clauses ?? []} />
        </Card>
      )}

      {tab === 'requirements' && (
        <Card className="divide-y divide-[rgb(var(--border-color))]">
          {requirements?.map((req) => (
            <RequirementRow key={req.id} requirement={req} />
          ))}
          {requirements?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No requirements.</p>}
        </Card>
      )}

      {tab === 'progress' && (
        <Card className="p-4">
          {progress ? (
            <ProgressView progress={progress} />
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">No progress data. Enable this framework first.</p>
          )}
        </Card>
      )}
    </div>
  );
}

function ClauseTree({ clauses }: { clauses: Clause[] }) {
  if (!clauses.length) return <p className="text-sm text-[rgb(var(--muted))]">No clauses.</p>;
  return (
    <div className="flex flex-col gap-2">
      {clauses.map((c) => (
        <ClauseItem key={c.id} clause={c} depth={0} />
      ))}
    </div>
  );
}

function ClauseItem({ clause, depth }: { clause: Clause; depth: number }) {
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <p className="text-sm font-medium">{clause.code ? `${clause.code} - ` : ''}{clause.title}</p>
      {clause.children?.length ? (
        <div className="mt-1 flex flex-col gap-1">
          {clause.children.map((child) => (
            <ClauseItem key={child.id} clause={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RequirementRow({ requirement }: { requirement: Requirement }) {
  const { data: controls } = useControlsForRequirement(requirement.frameworkId, requirement.id);
  return (
    <div className="p-4">
      <p className="text-sm font-medium">
        {requirement.code ? `${requirement.code} - ` : ''}{requirement.title}
      </p>
      {requirement.description && <p className="text-xs text-[rgb(var(--muted))]">{requirement.description}</p>}
      {controls?.length ? (
        <div className="mt-2 flex flex-col gap-1">
          {controls.map((ctrl) => (
            <ControlRow key={ctrl.id} control={ctrl} frameworkId={requirement.frameworkId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ControlRow({ control, frameworkId }: { control: Control; frameworkId: string }) {
  const [status, setStatus] = useState(control.controlType ?? '');
  const setControlStatus = useSetControlStatus();
  return (
    <div className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-2">
      <span className="text-xs">{control.title}</span>
      <div className="flex items-center gap-2">
        <select
          className="h-8 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-xs"
          value={status}
          onChange={(e) => {
            const value = e.target.value as ControlStatusState;
            setStatus(value);
            setControlStatus.mutate({ id: frameworkId, controlId: control.id, status: value });
          }}
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="implemented">Implemented</option>
          <option value="not_applicable">N/A</option>
        </select>
      </div>
    </div>
  );
}

function ProgressView({ progress }: { progress: FrameworkProgress }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Overall Progress</p>
        <p className="text-2xl font-semibold">{progress.progress}%</p>
        <p className="text-xs text-[rgb(var(--muted))]">
          {progress.compliantRequirements} / {progress.applicableRequirements} applicable requirements compliant
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={progress.totalRequirements} />
        <Stat label="Applicable" value={progress.applicableRequirements} />
        <Stat label="Compliant" value={progress.compliantRequirements} />
        <Stat label="Pending" value={progress.pendingRequirements} />
      </div>
      {progress.byCategory.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">By Category</p>
          <div className="flex flex-col gap-2">
            {progress.byCategory.map((cat) => (
              <div key={cat.categoryId ?? 'uncategorized'} className="flex items-center justify-between rounded-md border border-[rgb(var(--border-color))] p-2">
                <span className="text-xs">{cat.name ?? 'Uncategorized'}</span>
                <span className="text-xs text-[rgb(var(--muted))]">{cat.progress}% ({cat.compliant}/{cat.total})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-[rgb(var(--muted))]">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </Card>
  );
}
