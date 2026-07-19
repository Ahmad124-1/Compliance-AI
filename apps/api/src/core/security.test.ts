import { describe, expect, it } from 'vitest';

import {
  validateUpload,
  isSafeFilename,
  safeStoragePath,
  safeEqual,
  createDownloadToken,
  verifyDownloadToken,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_BYTES,
} from '../core/security.js';

describe('security.upload', () => {
  it('accepts allowlisted mime types within size limits', () => {
    const result = validateUpload({ mimeType: 'image/png', sizeBytes: 1024, filename: 'evidence.png' });
    expect(result.ok).toBe(true);
  });

  it('rejects disallowed mime types', () => {
    const result = validateUpload({ mimeType: 'application/x-msdownload', sizeBytes: 1024, filename: 'malware.exe' });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Unsupported/);
  });

  it('rejects oversized files', () => {
    const result = validateUpload({ mimeType: 'application/pdf', sizeBytes: MAX_UPLOAD_BYTES + 1, filename: 'big.pdf' });
    expect(result.ok).toBe(false);
  });

  it('rejects traversal filenames', () => {
    expect(isSafeFilename('../../etc/passwd')).toBe(false);
    expect(isSafeFilename('a/../b')).toBe(false);
    expect(isSafeFilename('ok.png')).toBe(true);
  });

  it('produces a storage path that stays within the tenant root', () => {
    const p = safeStoragePath('org-1', 'report.pdf');
    expect(p.startsWith('uploads/org-1/')).toBe(true);
    expect(p).not.toContain('..');
  });
});

describe('security.tokens', () => {
  it('verifies a freshly created download token', () => {
    const { token } = createDownloadToken('res-123');
    expect(verifyDownloadToken(token, 'res-123')).toBe(true);
  });

  it('rejects a token for a different resource', () => {
    const { token } = createDownloadToken('res-123');
    expect(verifyDownloadToken(token, 'res-999')).toBe(false);
  });

  it('constant-time compare is order independent of content', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('security.allowlist', () => {
  it('includes documents and images', () => {
    expect(ALLOWED_UPLOAD_MIME_TYPES.has('application/pdf')).toBe(true);
    expect(ALLOWED_UPLOAD_MIME_TYPES.has('image/jpeg')).toBe(true);
  });
});
