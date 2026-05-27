import { createCipheriv } from 'crypto';

const AES_BLOCK_BYTES = 16;

export function validateAesConfig(): void {
  const key = process.env.MUADI_AES_KEY;
  const iv = process.env.MUADI_AES_IV;

  if (!key || Buffer.byteLength(key, 'utf8') !== AES_BLOCK_BYTES) {
    throw new Error('MUADI_AES_KEY must be exactly 16 bytes UTF-8');
  }

  if (!iv || Buffer.byteLength(iv, 'utf8') !== AES_BLOCK_BYTES) {
    throw new Error('MUADI_AES_IV must be exactly 16 bytes UTF-8');
  }
}

export function encryptMuadi(plaintext: string): string {
  validateAesConfig();
  const cipher = createCipheriv(
    'aes-128-cbc',
    Buffer.from(process.env.MUADI_AES_KEY as string, 'utf8'),
    Buffer.from(process.env.MUADI_AES_IV as string, 'utf8'),
  );

  return cipher.update(plaintext, 'utf8', 'base64') + cipher.final('base64');
}

export function decodeJwtExpiry(token: string): number {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return 0;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };

    return typeof decoded.exp === 'number' ? decoded.exp : 0;
  } catch {
    return 0;
  }
}
