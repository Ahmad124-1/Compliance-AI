'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

import { Button } from '@/components/ui/button.js';
import { Card } from '@/components/ui/card.js';
import { Field, Input } from '@/components/ui/Field.js';
import { useUsers, useInviteUser, useSetUserStatus } from '@/modules/users/module.store.js';
import { inviteSchema, type InviteInput } from '@/modules/users/module.validation.js';
import { useRoles } from '@/modules/rbac/module.store.js';
import { useAuth } from '@/providers/AuthProvider.js';

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();
  const { data: roles } = useRoles();
  const invite = useInviteUser();
  const setStatus = useSetUserStatus();
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({ resolver: zodResolver(inviteSchema) });

  const onSubmit = async (data: InviteInput) => {
    await invite.mutateAsync(data);
    reset();
    setOpen(false);
  };

  if (isLoading) return <p className="text-sm text-[rgb(var(--muted))]">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        {hasPermission('user:invite') && (
          <Button size="sm" onClick={() => setOpen((o) => !o)}>
            Invite user
          </Button>
        )}
      </div>

      {open && hasPermission('user:invite') && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register('email')} />
              </Field>
              <Field label="Role">
                <select className="h-10 rounded-md border border-[rgb(var(--border-color))] bg-transparent px-2 text-sm" {...register('roleId')}>
                  <option value="">— none —</option>
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                Send invite
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="divide-y divide-[rgb(var(--border-color))]">
        {users?.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">
                {u.firstName ?? ''} {u.lastName ?? ''} <span className="text-[rgb(var(--muted))]">({u.email})</span>
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">status: {u.status}</p>
            </div>
            <div className="flex gap-2">
              {hasPermission('user:update') && u.status !== 'active' && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, action: 'activate' })}>
                  Activate
                </Button>
              )}
              {hasPermission('user:update') && u.status === 'active' && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, action: 'disable' })}>
                  Disable
                </Button>
              )}
            </div>
          </div>
        ))}
        {users?.length === 0 && <p className="p-4 text-sm text-[rgb(var(--muted))]">No users yet.</p>}
      </Card>
    </div>
  );
}
