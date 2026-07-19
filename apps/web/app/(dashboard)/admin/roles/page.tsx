'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import {
  useRoles,
  useCreateRole,
  usePermissions,
  useRolePermissions,
  useAssignPermission,
} from '@/modules/rbac/module.store.js';
import { createRoleSchema, type CreateRoleInput } from '@/modules/rbac/module.validation.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function RolesPage() {
  const { data: roles } = useRoles();
  const { data: permissions } = usePermissions();
  const createRole = useCreateRole();
  const assign = useAssignPermission();
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const rolePerms = useRolePermissions(selectedRole);
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateRoleInput>({ resolver: zodResolver(createRoleSchema) });

  const onSubmit = async (d: { name: string; key: string; description?: string }) => {
    const role = await createRole.mutateAsync(d);
    setSelectedRole(role.id);
    setOpen(false);
    form.reset();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Roles &amp; Permissions</h1>
        {hasPermission('role:create') && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            New role
          </Button>
        )}
      </div>

      {open && hasPermission('role:create') && (
        <Card className="mb-4 p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Key" error={form.formState.errors.key?.message}>
                <Input {...form.register('key')} />
              </Field>
            </div>
            <Field label="Description">
              <Input {...form.register('description')} />
            </Field>
            <Button type="submit" size="sm">Create role</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <Card className="divide-y divide-[rgb(var(--border-color))] self-start">
          {roles?.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`block w-full p-3 text-left text-sm ${selectedRole === r.id ? 'bg-[rgb(var(--panel-2))]' : ''}`}
            >
              {r.name} <span className="text-[rgb(var(--muted))]">({r.key})</span>
            </button>
          ))}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">
            Permissions {selectedRole ? 'for selected role' : '— select a role'}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {permissions?.map((p) => {
              const assigned = rolePerms.data?.some((rp) => rp.id === p.id);
              return (
                <button
                  key={p.id}
                  disabled={!selectedRole || !hasPermission('role:assign')}
                  onClick={() => selectedRole && assign.mutate({ roleId: selectedRole, permissionId: p.id })}
                  className={`rounded-md border px-2 py-1 text-left text-xs ${assigned ? 'border-[rgb(var(--primary))] bg-[rgb(var(--panel-2))]' : 'border-[rgb(var(--border-color))]'}`}
                >
                  {p.key}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-[rgb(var(--muted))]">
            Click a permission to toggle assignment for the selected role.
          </p>
        </Card>
      </div>
    </div>
  );
}
