'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usersService } from './module.service.js';
import type { PublicUser } from './module.types.js';

export function useUsers() {
  return useQuery({ queryKey: ['users', 'list'], queryFn: usersService.list });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.invite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'list'] }),
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; action: 'activate' | 'disable' }) =>
      vars.action === 'activate' ? usersService.activate(vars.id) : usersService.disable(vars.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'list'] }),
  });
}

export function useAssignUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; roleId: string; action: 'assign' | 'unassign' }) =>
      vars.action === 'assign'
        ? usersService.assignRole(vars.id, vars.roleId)
        : usersService.unassignRole(vars.id, vars.roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users', 'list'] }),
  });
}

export type { PublicUser };
