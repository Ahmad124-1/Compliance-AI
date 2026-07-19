import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { USERS_ENDPOINTS } from './module.constants.js';
import type { InviteInput } from './module.validation.js';
import type { PublicUser } from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const usersApi = {
  list: () => http<PublicUser[]>(USERS_ENDPOINTS.base),
  get: (id: string) => http<PublicUser>(`${USERS_ENDPOINTS.base}/${id}`),
  invite: (dto: InviteInput) =>
    http<PublicUser>(`${USERS_ENDPOINTS.base}/invite`, { method: 'POST', body: JSON.stringify(dto) }),
  activate: (id: string) => http<PublicUser>(`${USERS_ENDPOINTS.base}/${id}/activate`, { method: 'POST' }),
  disable: (id: string) => http<PublicUser>(`${USERS_ENDPOINTS.base}/${id}/disable`, { method: 'POST' }),
  assignRole: (id: string, roleId: string) =>
    http(`${USERS_ENDPOINTS.base}/${id}/roles/${roleId}`, { method: 'POST' }),
  unassignRole: (id: string, roleId: string) =>
    http(`${USERS_ENDPOINTS.base}/${id}/roles/${roleId}`, { method: 'DELETE' }),
};
