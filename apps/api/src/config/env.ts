import 'dotenv/config';

/**
 * Typed environment access. Values come from process.env (loaded via dotenv).
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.API_PORT ?? 4000),
  HOST: process.env.API_HOST ?? '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://complianceos:complianceos@localhost:5432/complianceos',
  JWT_SECRET: process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me',
  JWT_ISSUER: process.env.AUTH_ISSUER ?? 'complianceos-ai',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE ?? 'complianceos-ai-client',
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '15m',
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 12),
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASSWORD ?? '',
  SMTP_FROM: process.env.SMTP_FROM ?? 'no-reply@complianceos.ai',
  ENABLE_REGISTRATION: (process.env.ENABLE_REGISTRATION ?? 'true') === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
} as const;

export type Env = typeof env;
