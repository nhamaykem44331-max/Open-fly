import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const APP_CRYPTO_VERSION = 'v1';
const GCM_IV_BYTES = 12;
const GCM_AUTH_TAG_BYTES = 16;

function getAppEncryptionKey(): Buffer {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('APP_ENCRYPTION_KEY must be 64 hex chars');
  }

  return Buffer.from(key, 'hex');
}

export function encryptApp(plaintext: string): string {
  const iv = randomBytes(GCM_IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', getAppEncryptionKey(), iv, {
    authTagLength: GCM_AUTH_TAG_BYTES,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    APP_CRYPTO_VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':');
}

export function decryptApp(ciphertext: string): string {
  const [version, ivBase64, tagBase64, encryptedBase64] = ciphertext.split(':');
  if (version !== APP_CRYPTO_VERSION || !ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error('Invalid encrypted app payload');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getAppEncryptionKey(),
    Buffer.from(ivBase64, 'base64'),
    { authTagLength: GCM_AUTH_TAG_BYTES },
  );
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
