import crypto from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { sha256 } from './crypto.js';

export interface AccessTokenClaims {
  sub: string; // user id
  org: string; // active organization id
  email: string;
  roles: string[]; // role keys
  perms: string[]; // permission keys (flattened)
  typ: 'access';
  iss: string;
  aud: string;
}

/**
 * Token service: issues and verifies access tokens (signed JWT), and
 * manages revocable refresh tokens stored in the database.
 */
export class TokenService {
  constructor(private readonly app: FastifyInstance) {}

  signAccess(claims: Omit<AccessTokenClaims, 'typ' | 'iss' | 'aud'>): string {
    return this.app.jwt.sign(
      { ...claims, typ: 'access', iss: env.JWT_ISSUER, aud: env.JWT_AUDIENCE },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );
  }

  verifyAccess(token: string): AccessTokenClaims {
    const decoded = this.app.jwt.verify<AccessTokenClaims>(token);
    if (decoded.typ !== 'access') throw new Error('invalid token type');
    return decoded;
  }

  async issueRefresh(userId: string, device?: string): Promise<string> {
    const raw = cryptoRandom();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, tokenHash, device ?? null, expiresAt],
    );
    return raw;
  }

  async rotateRefresh(raw: string): Promise<{ userId: string; refresh: string }> {
    const tokenHash = sha256(raw);
    const { rows } = await query<{
      user_id: string;
      expires_at: Date;
      revoked: boolean;
    }>(
      `SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
    const record = rows[0];
    if (!record || record.revoked || record.expires_at.getTime() < Date.now()) {
      throw new Error('invalid_refresh_token');
    }
    // Revoke old, issue new (rotation).
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [tokenHash]);
    const refresh = await this.issueRefresh(record.user_id);
    return { userId: record.user_id, refresh };
  }

  async revokeAll(userId: string): Promise<void> {
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1`, [userId]);
  }

  async revoke(raw: string): Promise<void> {
    await query(`UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1`, [sha256(raw)]);
  }
}

function cryptoRandom(): string {
  return crypto.randomBytes(48).toString('hex');
}
