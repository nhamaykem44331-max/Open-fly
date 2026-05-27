import { decodeJwtExpiry, encryptMuadi, validateAesConfig } from '../muadi-crypto.util';

describe('muadi-crypto.util', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('encrypts Muadi payload with AES-128-CBC and base64 output', () => {
    process.env.MUADI_AES_KEY = '1234567890abcdef';
    process.env.MUADI_AES_IV = 'abcdef1234567890';

    expect(encryptMuadi('{"hello":"world"}')).toBe(
      'xD/0FxnCQ3WtsRdU41T2qT9M+Qv+2vSMPI4DaLIBvuA=',
    );
  });

  it('throws when AES key is not exactly 16 bytes UTF-8', () => {
    process.env.MUADI_AES_KEY = 'short';
    process.env.MUADI_AES_IV = 'abcdef1234567890';

    expect(() => validateAesConfig()).toThrow(
      'MUADI_AES_KEY must be exactly 16 bytes UTF-8',
    );
  });

  it('decodes JWT expiry from payload', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ exp: 1893456000 })).toString('base64url');

    expect(decodeJwtExpiry(`${header}.${payload}.`)).toBe(1893456000);
    expect(decodeJwtExpiry('invalid')).toBe(0);
  });
});
