import { IncomingHttpHeaders } from 'http';

export interface SepayWebhookPayload {
  id: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  transferType: 'in' | 'out' | string;
  transferAmount: number | string;
  accumulated?: number | string;
  code?: string | null;
  content?: string;
  referenceCode?: string | null;
  description?: string | null;
}

export interface SepayQrInput {
  transferContent: string;
  amount: number;
  accountNumber?: string;
  bankCode?: string;
  template?: string;
}

export interface SepayQrResult {
  qrUrl: string;
  accountNumber: string;
  bankCode: string;
  accountName: string | null;
}

const SEPAY_DEFAULT_IPS = [
  '172.236.138.20',
  '172.233.83.68',
  '171.244.35.2',
  '151.158.108.68',
  '151.158.109.79',
  '103.255.238.139',
] as const;

export function buildSepayQrUrl(input: SepayQrInput): SepayQrResult {
  assertConfigured();

  const accountNumber = (input.accountNumber ??
    process.env.SEPAY_BANK_ACCOUNT)!.trim();
  const bankCode = (input.bankCode ?? process.env.SEPAY_BANK_CODE)!.trim();
  const template = input.template ?? process.env.SEPAY_QR_TEMPLATE ?? 'compact';
  const accountName = process.env.SEPAY_BANK_ACCOUNT_NAME?.trim() || null;
  const params = new URLSearchParams({
    acc: accountNumber,
    bank: bankCode,
    amount: String(input.amount),
    des: input.transferContent,
    template,
  });

  return {
    qrUrl: `https://qr.sepay.vn/img?${params.toString()}`,
    accountNumber,
    bankCode,
    accountName,
  };
}

export function buildDedupeKey(payload: SepayWebhookPayload): string {
  return `SEPAY:${String(payload.id)}:${String(payload.transferAmount)}`;
}

export function parseSepayAmount(
  value: number | string | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return Math.round(value);
  }

  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function parseSepayTransactionDate(
  value: string | null | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  const normalized = value.includes('T')
    ? value
    : `${value.replace(' ', 'T')}+07:00`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function extractOrderCode(
  content: string | null | undefined,
): string | null {
  if (!content) {
    return null;
  }

  const match = content.match(/OPENFLY[\s_-]?(\d{6,})/i);
  return match?.[1] ?? null;
}

export function getWhitelistIps(): string[] {
  const raw = process.env.SEPAY_WEBHOOK_IPS?.trim();
  if (!raw) {
    return [...SEPAY_DEFAULT_IPS];
  }

  return raw
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export function extractClientIp(headers: IncomingHttpHeaders): string | null {
  const forwarded = firstHeader(headers['x-forwarded-for']);
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return (
    firstHeader(headers['x-real-ip']) ??
    firstHeader(headers['cf-connecting-ip']) ??
    null
  );
}

export function isIpAllowed(ip: string | null): boolean {
  if (process.env.SEPAY_SKIP_IP_CHECK === 'true') {
    return true;
  }
  if (!ip) {
    return false;
  }

  return getWhitelistIps().includes(ip);
}

export function verifyAuth(headers: IncomingHttpHeaders): boolean {
  const expected = process.env.SEPAY_WEBHOOK_API_KEY?.trim();
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = firstHeader(headers.authorization)?.trim() ?? '';
  const token = authHeader
    .replace(/^Bearer\s+/i, '')
    .replace(/^Apikey\s+/i, '')
    .trim();

  return token === expected;
}

export function assertConfigured(): void {
  const account = process.env.SEPAY_BANK_ACCOUNT?.trim();
  const bank = process.env.SEPAY_BANK_CODE?.trim();
  if (!account || !bank) {
    throw new Error('Thiếu SEPAY_BANK_ACCOUNT hoặc SEPAY_BANK_CODE');
  }
}

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
