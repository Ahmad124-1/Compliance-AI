/**
 * Form + DTO schemas for the auth module.
 * Validation lives in module.validation.ts (Zod); this layer maps to API DTOs.
 */
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ProfileInput,
  RegisterInput,
  ResetPasswordInput,
} from './module.validation.js';

export type LoginDto = LoginInput;
export type RegisterDto = Omit<RegisterInput, 'confirmPassword'>;
export type ForgotPasswordDto = ForgotPasswordInput;
export type ResetPasswordDto = Omit<ResetPasswordInput, 'confirmPassword'>;
export type ChangePasswordDto = Omit<ChangePasswordInput, 'confirmPassword'>;
export type ProfileDto = ProfileInput;

export function toLoginDto(input: LoginInput): LoginDto {
  return { email: input.email, password: input.password };
}

export function toRegisterDto(input: RegisterInput): RegisterDto {
  const { confirmPassword: _confirm, ...rest } = input;
  void _confirm;
  return {
    organizationName: rest.organizationName,
    firstName: rest.firstName || undefined,
    lastName: rest.lastName || undefined,
    email: rest.email,
    password: rest.password,
  };
}

export function toResetDto(input: ResetPasswordInput): ResetPasswordDto {
  const { confirmPassword: _confirm, ...rest } = input;
  void _confirm;
  return { token: rest.token, password: rest.password };
}

export function toChangePasswordDto(input: ChangePasswordInput): ChangePasswordDto {
  const { confirmPassword: _confirm, ...rest } = input;
  void _confirm;
  return { currentPassword: rest.currentPassword, newPassword: rest.newPassword };
}

export function toProfileDto(input: ProfileInput): ProfileDto {
  return { ...input };
}
