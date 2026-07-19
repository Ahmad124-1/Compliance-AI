'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useSites, useCreateSite, useDepartments, useCreateDepartment, useTeams, useCreateTeam } from '@/modules/tenants/module.store.js';
import { createSiteSchema, createDepartmentSchema, createTeamSchema } from '@/modules/tenants/module.validation.js';
import type { CreateSiteInput, CreateDepartmentInput, CreateTeamInput } from '@/modules/tenants/module.types.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function SitesPage() {
  const { data: sites } = useSites();
  const { data: depts } = useDepartments();
  const { data: teams } = useTeams();
  const createSite = useCreateSite();
  const createDept = useCreateDepartment();
  const createTeam = useCreateTeam();
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<'sites' | 'departments' | 'teams'>('sites');

  const siteForm = useForm<CreateSiteInput>({ resolver: zodResolver(createSiteSchema) });
  const deptForm = useForm<CreateDepartmentInput>({ resolver: zodResolver(createDepartmentSchema) });
  const teamForm = useForm<CreateTeamInput>({ resolver: zodResolver(createTeamSchema) });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-2xl font-semibold">Tenant Hierarchy</h1>
      <div className="mb-4 flex gap-2">
        {(['sites', 'departments', 'teams'] as const).map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === 'sites' && (
        <section>
          {hasPermission('site:create') && (
            <Card className="mb-4 p-4">
              <form onSubmit={siteForm.handleSubmit((d) => createSite.mutateAsync(d))} className="flex flex-col gap-3">
                <Field label="Site / Factory name" error={siteForm.formState.errors.name?.message}>
                  <Input {...siteForm.register('name')} />
                </Field>
                <Field label="Code">
                  <Input {...siteForm.register('code')} />
                </Field>
                <Button type="submit" size="sm">Add site</Button>
              </form>
            </Card>
          )}
          <Card className="divide-y divide-[rgb(var(--border-color))]">
            {sites?.map((s) => (
              <div key={s.id} className="p-4 text-sm">
                {s.name} <span className="text-[rgb(var(--muted))]">{s.code ?? ''}</span>
              </div>
            ))}
            {sites?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No sites.</p>}
          </Card>
        </section>
      )}

      {tab === 'departments' && (
        <section>
          {hasPermission('department:create') && (
            <Card className="mb-4 p-4">
              <form onSubmit={deptForm.handleSubmit((d) => createDept.mutateAsync(d))} className="flex flex-col gap-3">
                <Field label="Department name" error={deptForm.formState.errors.name?.message}>
                  <Input {...deptForm.register('name')} />
                </Field>
                <Field label="Code">
                  <Input {...deptForm.register('code')} />
                </Field>
                <Button type="submit" size="sm">Add department</Button>
              </form>
            </Card>
          )}
          <Card className="divide-y divide-[rgb(var(--border-color))]">
            {depts?.map((d) => (
              <div key={d.id} className="p-4 text-sm">
                {d.name} <span className="text-[rgb(var(--muted))]">{d.code ?? ''}</span>
              </div>
            ))}
            {depts?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No departments.</p>}
          </Card>
        </section>
      )}

      {tab === 'teams' && (
        <section>
          {hasPermission('team:create') && (
            <Card className="mb-4 p-4">
              <form onSubmit={teamForm.handleSubmit((d) => createTeam.mutateAsync(d))} className="flex flex-col gap-3">
                <Field label="Team name" error={teamForm.formState.errors.name?.message}>
                  <Input {...teamForm.register('name')} />
                </Field>
                <Field label="Code">
                  <Input {...teamForm.register('code')} />
                </Field>
                <Button type="submit" size="sm">Add team</Button>
              </form>
            </Card>
          )}
          <Card className="divide-y divide-[rgb(var(--border-color))]">
            {teams?.map((t) => (
              <div key={t.id} className="p-4 text-sm">
                {t.name} <span className="text-[rgb(var(--muted))]">{t.code ?? ''}</span>
              </div>
            ))}
            {teams?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No teams.</p>}
          </Card>
        </section>
      )}
    </div>
  );
}
