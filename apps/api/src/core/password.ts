import bcrypt from 'bcryptjs';

import { env } from '../config/env.js';

export const password = {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
  },
  verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },
  /**
   * Enforce minimum strength policy.
   */
  isStrong(plain: string): boolean {
    return (
      plain.length >= 10 &&
      /[a-z]/.test(plain) &&
      /[A-Z]/.test(plain) &&
      /[0-9]/.test(plain) &&
      /[^A-Za-z0-9]/.test(plain)
    );
  },
};
