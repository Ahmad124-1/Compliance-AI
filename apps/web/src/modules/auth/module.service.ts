import { authApi } from './module.api.js';
import { tokenStorage } from '@/lib/auth/storage.js';
import type {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  ProfileDto,
  RegisterDto,
  ResetPasswordDto,
} from './module.schema.js';
import type { Session } from './module.types.js';

/**
 * Client-side service abstraction for auth API calls.
 * Keeps token persistence and refresh-rotation concerns in one place.
 */
export const authService = {
  async login(dto: LoginDto): Promise<Session> {
    const session = await authApi.login(dto);
    tokenStorage.setTokens(session.accessToken, session.refreshToken);
    return session;
  },

  async register(dto: RegisterDto): Promise<Session> {
    const session = await authApi.register(dto);
    tokenStorage.setTokens(session.accessToken, session.refreshToken);
    return session;
  },

  async logout(): Promise<void> {
    const refresh = tokenStorage.getRefreshToken() ?? undefined;
    try {
      await authApi.logout(refresh);
    } finally {
      tokenStorage.clear();
    }
  },

  async refresh(): Promise<Session | null> {
    const refresh = tokenStorage.getRefreshToken();
    if (!refresh) return null;
    try {
      const session = await authApi.refresh(refresh);
      tokenStorage.setTokens(session.accessToken, session.refreshToken);
      return session;
    } catch {
      tokenStorage.clear();
      return null;
    }
  },

  async forgotPassword(dto: ForgotPasswordDto) {
    return authApi.forgotPassword(dto);
  },
  async resetPassword(dto: ResetPasswordDto) {
    return authApi.resetPassword(dto);
  },
  async changePassword(dto: ChangePasswordDto) {
    return authApi.changePassword(dto);
  },
  async verifyEmail(token: string) {
    return authApi.verifyEmail(token);
  },
  async updateProfile(userId: string, dto: ProfileDto) {
    return authApi.updateProfile(userId, dto);
  },
  async me() {
    return authApi.me();
  },
};
