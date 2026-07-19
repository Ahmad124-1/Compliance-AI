import { usersApi } from './module.api.js';
import type { InviteInput } from './module.validation.js';

export const usersService = {
  list: () => usersApi.list(),
  get: (id: string) => usersApi.get(id),
  invite: (dto: InviteInput) => usersApi.invite(dto),
  activate: (id: string) => usersApi.activate(id),
  disable: (id: string) => usersApi.disable(id),
  assignRole: (id: string, roleId: string) => usersApi.assignRole(id, roleId),
  unassignRole: (id: string, roleId: string) => usersApi.unassignRole(id, roleId),
};
