import type { FastifyRequest } from 'fastify';

import { UnauthorizedError, ForbiddenError } from '../core/errors.js';
import type { AccessTokenClaims } from '../core/tokens.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: AccessTokenClaims;
  }
}

/**
 * Pre-handler that validates the Bearer access token and attaches claims.
 */
export async function authenticate(request: FastifyRequest): Promise<void> {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const token = header.slice('Bearer '.length);
  try {
    request.auth = request.server.jwt.verify<AccessTokenClaims>(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Build a permission guard pre-handler.
 */
export function requirePermission(...keys: string[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!request.auth) throw new UnauthorizedError();
    const perms = new Set(request.auth.perms);
    const ok = keys.some((k) => perms.has(k));
    if (!ok) throw new ForbiddenError(`Missing permission: ${keys.join('|')}`);
  };
}

export function getAuth(request: FastifyRequest): AccessTokenClaims {
  if (!request.auth) throw new UnauthorizedError();
  return request.auth;
}
