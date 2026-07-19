import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { authService } from '../services/auth.service.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

const forgotSchema = z.object({ email: z.string().email() });

const resetSchema = z.object({ token: z.string().min(1), password: z.string().min(10) });

const changeSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(10) });

const verifySchema = z.object({ token: z.string().min(1) });

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', { schema: { body: registerSchema } }, async (req, reply) => {
    const session = await authService.register(app, req.body as any);
    return reply.code(201).send(session);
  });

  app.post('/login', { schema: { body: loginSchema } }, async (req, reply) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const session = await authService.login(app, email, password);
    return reply.send(session);
  });

  app.post('/refresh', { schema: { body: refreshSchema } }, async (req, reply) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const session = await authService.refresh(app, refreshToken);
    return reply.send(session);
  });

  app.post('/logout', async (req, reply) => {
    const refresh = (req.body as { refreshToken?: string })?.refreshToken;
    await authService.logout(app, refresh);
    return reply.send({ success: true });
  });

  app.post('/forgot-password', { schema: { body: forgotSchema } }, async (req, reply) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    await authService.requestPasswordReset(email);
    return reply.send({ success: true, devTokenNote: 'token logged server-side in dev' });
  });

  app.post('/reset-password', { schema: { body: resetSchema } }, async (req, reply) => {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    await authService.resetPassword(token, password);
    return reply.send({ success: true });
  });

  app.post('/change-password', { schema: { body: changeSchema } }, async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth) return reply.code(401).send({ error: 'UNAUTHORIZED' });
    const { currentPassword, newPassword } = req.body as z.infer<typeof changeSchema>;
    await authService.changePassword(auth.sub, currentPassword, newPassword);
    return reply.send({ success: true });
  });

  app.post('/verify-email', { schema: { body: verifySchema } }, async (req, reply) => {
    const { token } = req.body as z.infer<typeof verifySchema>;
    await authService.verifyEmail(token);
    return reply.send({ success: true });
  });

  app.get('/me', async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth) return reply.code(401).send({ error: 'UNAUTHORIZED' });
    return reply.send({
      sub: auth.sub,
      email: auth.email,
      org: auth.org,
      roles: auth.roles,
      permissions: auth.perms,
    });
  });

  // Dev helpers
  if (env.NODE_ENV !== 'production') {
    app.get('/health', async () => ({ status: 'ok', env: env.NODE_ENV }));
  }
}
