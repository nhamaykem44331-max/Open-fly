import { randomInt } from 'crypto';

async function main() {
  const [providerOrderCode, amountArg, idArg] = process.argv.slice(2);
  if (!providerOrderCode || !amountArg) {
    throw new Error(
      'Usage: npm run sepay:simulate -- <providerOrderCode> <amount> [transactionId]',
    );
  }

  const amount = Number(amountArg);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('amount phải là số VND hợp lệ');
  }

  const apiUrl =
    process.env.OPENFLY_API_URL ??
    'http://localhost:3001/api/v1/webhooks/sepay';
  const id = idArg ?? `sim-${Date.now()}-${randomInt(100, 999)}`;
  const payload = {
    id,
    gateway: 'SIMULATOR',
    transactionDate: formatSepayDate(new Date()),
    accountNumber: process.env.SEPAY_BANK_ACCOUNT ?? '0000000000',
    subAccount: null,
    transferType: 'in',
    transferAmount: amount,
    accumulated: amount,
    code: null,
    content: `OPENFLY${providerOrderCode}`,
    referenceCode: `SIM-${id}`,
    description: `OPENFLY${providerOrderCode}`,
  };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (process.env.SEPAY_WEBHOOK_API_KEY) {
    headers.Authorization = `Apikey ${process.env.SEPAY_WEBHOOK_API_KEY}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const body = await response.text();

  console.log(`HTTP ${response.status}`);
  console.log(body);
}

function formatSepayDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace('T', ' ');

  return parts;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
