import { createHttpClient } from '@/lib/api/client.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import { AUTH_ENDPOINTS } from './module.constants.js';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ProfileDto,
  RegisterDto,
  ResetPasswordDto,
} from './module.schema.js';
import type { Session } from './module.types.js';

const http = createHttpClient(() => tokenStorage.getAccessToken());

export const authApi = {
  async register(dto: RegisterDto): Promise<Session> {
    return http<Session>(AUTH_ENDPOINTS.register, { method: 'POST', body: JSON.stringify(dto) });
  },
  async login(dto: LoginDto): Promise<Session> {
    return http<Session>(AUTH_ENDPOINTS.login, { method: 'POST', body: JSON.stringify(dto) });
  },
  async refresh(refreshToken: string): Promise<Session> {
    return http<Session>(AUTH_ENDPOINTS.refresh, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  async logout(refreshToken?: string): Promise<void> {
    await http(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ success: boolean }> {
    return http(AUTH_ENDPOINTS.forgotPassword, { method: 'POST', body: JSON.stringify(dto) });
  },
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    return http(AUTH_ENDPOINTS.resetPassword, { method: 'POST', body: JSON.stringify(dto) });
  },
  async changePassword(dto: ChangePasswordDto): Promise<{ success: boolean }> {
    return http(AUTH_ENDPOINTS.changePassword, { method: 'POST', body: JSON.stringify(dto) });
  },
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    return http(AUTH_ENDPOINTS.verifyEmail, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  async me(): Promise<{ sub: string; email: string; org: string; roles: string[]; permissions: string[] }> {
    return http(AUTH_ENDPOINTS.me);
  },
  async updateProfile(userId: string, dto: ProfileDto): Promise<Session['user']> {
    return http<Session['user']>(`/api/v1/users/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  },
};
