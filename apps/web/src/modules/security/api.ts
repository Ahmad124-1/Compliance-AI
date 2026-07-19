import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { SECURITY_ENDPOINTS } from './constants.js';
import type { SecurityReport } from './types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const securityApi = {
  review: () => http<SecurityReport>(SECURITY_ENDPOINTS.review),
};

export const securityService = {
  review: () => securityApi.review(),
};
