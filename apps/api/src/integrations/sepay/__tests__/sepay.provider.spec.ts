import {
  buildDedupeKey,
  buildSepayQrUrl,
  extractOrderCode,
  isIpAllowed,
  parseSepayAmount,
  parseSepayTransactionDate,
  verifyAuth,
} from '../sepay.provider';

describe('SePay provider helpers', () => {
  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...oldEnv,
      SEPAY_BANK_ACCOUNT: '123456789',
      SEPAY_BANK_CODE: 'VCB',
      SEPAY_BANK_ACCOUNT_NAME: 'OPENFLY TEST',
      SEPAY_QR_TEMPLATE: 'compact',
      SEPAY_WEBHOOK_API_KEY: 'secret-key',
      SEPAY_SKIP_IP_CHECK: 'true',
    };
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it('builds dynamic QR URL with OPENFLY transfer content', () => {
    const result = buildSepayQrUrl({
      transferContent: 'OPENFLY1760000000001',
      amount: 1234567,
    });

    expect(result.qrUrl).toContain('https://qr.sepay.vn/img?');
    expect(result.qrUrl).toContain('acc=123456789');
    expect(result.qrUrl).toContain('bank=VCB');
    expect(result.qrUrl).toContain('amount=1234567');
    expect(result.qrUrl).toContain('des=OPENFLY1760000000001');
  });

  it('extracts provider order code from supported OPENFLY formats', () => {
    expect(extractOrderCode('OPENFLY1760000000001')).toBe('1760000000001');
    expect(extractOrderCode('Thanh toan OPENFLY 1760000000002')).toBe(
      '1760000000002',
    );
    expect(extractOrderCode('OPENFLY-1760000000003')).toBe('1760000000003');
    expect(extractOrderCode('OPENFLY_1760000000004')).toBe('1760000000004');
    expect(extractOrderCode('APG1760000000005')).toBeNull();
  });

  it('parses SePay amount from number and formatted string', () => {
    expect(parseSepayAmount(1500000)).toBe(1500000);
    expect(parseSepayAmount('1,500,000 VND')).toBe(1500000);
    expect(parseSepayAmount(null)).toBe(0);
  });

  it('parses transaction date as Vietnam time', () => {
    expect(
      parseSepayTransactionDate('2026-06-11 16:40:00')?.toISOString(),
    ).toBe('2026-06-11T09:40:00.000Z');
  });

  it('builds dedupe key and verifies dev auth/IP gates', () => {
    expect(
      buildDedupeKey({
        id: 'tx-1',
        transferType: 'in',
        transferAmount: '100000',
      }),
    ).toBe('SEPAY:tx-1:100000');
    expect(isIpAllowed(null)).toBe(true);
    expect(verifyAuth({ authorization: 'Apikey secret-key' })).toBe(true);
    expect(verifyAuth({ authorization: 'Bearer wrong-key' })).toBe(false);
  });
});
