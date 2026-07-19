/**
 * Security hardening utilities.
 *
 * Centralizes reusable, testable guards used across modules:
 *  - Upload validation (allowlisted MIME types, size + extension checks, path escaping)
 *  - Secure download token generation (time-boxed, HMAC-signed)
 *  - Tracking PIN verification with constant-time compare + rate limiting hooks
 *
 * No external secrets are required; values derive from the existing env.
 */

import crypto from 'node:crypto';
import path from 'node:path';

import { env } from '../config/env.js';

/** Allowlisted content types for evidence / complaint attachments. */
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
]);

/** Maximum upload size (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export interface UploadValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateUpload(input: { mimeType: string; sizeBytes: number; filename: string }): UploadValidationResult {
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(input.mimeType)) {
    return { ok: false, reason: `Unsupported file type: ${input.mimeType}` };
  }
  if (input.sizeBytes <= 0 || input.sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `File size must be between 1 byte and ${MAX_UPLOAD_BYTES} bytes` };
  }
  if (!isSafeFilename(input.filename)) {
    return { ok: false, reason: 'Filename contains invalid characters' };
  }
  return { ok: true };
}

/** Reject path traversal and control characters in uploaded filenames. */
export function isSafeFilename(filename: string): boolean {
  if (!filename || filename.length > 255) return false;
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(filename)) return false;
  return true;
}

/** Produce a storage path that cannot escape the per-tenant uploads root. */
export function safeStoragePath(organizationId: string, filename: string): string {
  const sanitized = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const nonce = crypto.randomBytes(8).toString('hex');
  return `uploads/${organizationId}/${Date.now()}-${nonce}-${sanitized}`;
}

/** Constant-time string comparison to avoid timing attacks on PINs/tokens. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export interface SecureDownloadToken {
  token: string;
  expiresAt: number;
}

/**
 * Generate a time-boxed, HMAC-signed download token for a protected resource.
 * Verified later via `verifyDownloadToken`.
 */
export function createDownloadToken(resourceId: string, ttlSeconds = 300): SecureDownloadToken {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${resourceId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', env.JWT_SECRET).update(payload).digest('hex').slice(0, 32);
  const token = `${payload}.${signature}`;
  return { token, expiresAt: expiresAt * 1000 };
}

export function verifyDownloadToken(token: string, resourceId: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, expires, signature] = parts;
  const now = Math.floor(Date.now() / 1000);
  if (Number(expires) < now) return false;
  if (id !== resourceId) return false;
  const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(`${id}.${expires}`).digest('hex').slice(0, 32);
  return safeEqual(expected, signature);
}

/** Rate-limit key helper for PIN / tracking verification attempts. */
export function pinAttemptKey(identifier: string): string {
  return `pin:${crypto.createHash('sha256').update(identifier).digest('hex').slice(0, 16)}`;
}
