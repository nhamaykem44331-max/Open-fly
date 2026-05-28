import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BankTransaction,
  Booking,
  BookingStatus,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { randomInt } from 'crypto';
import {
  assertConfigured,
  buildDedupeKey,
  buildSepayQrUrl,
  extractOrderCode,
  parseSepayAmount,
  parseSepayTransactionDate,
  SepayWebhookPayload,
} from '../integrations/sepay/sepay.provider';
import { RedisService } from '../integrations/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

export type SepayWebhookStatus =
  | 'PAID'
  | 'PARTIAL'
  | 'OVERPAID'
  | 'DUPLICATE'
  | 'IGNORED'
  | 'NO_ORDER_CODE'
  | 'INTENT_NOT_FOUND'
  | 'BOOKING_NOT_PAYABLE';

export interface CreateSepayIntentResult {
  intent: PaymentIntent;
  qrUrl: string;
  expiresAt: Date;
}

export interface SepayWebhookResult {
  status: SepayWebhookStatus;
  reason?: string;
  bankTransactionId?: string;
  paymentIntentId?: string;
  paymentId?: string;
  bookingId?: string;
  orderCode?: string;
  amount?: number;
}

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async createIntentForBooking(
    bookingId: string,
    idempotencyKey?: string,
  ): Promise<CreateSepayIntentResult> {
    const cacheKey = idempotencyKey
      ? `idempotency:payment-intent:${bookingId}:${idempotencyKey}`
      : null;
    const cached = cacheKey ? await this.getCachedIntentResult(cacheKey) : null;
    if (cached) {
      return cached;
    }

    try {
      assertConfigured();
    } catch (error) {
      throw new ServiceUnavailableException(safeError(error));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: {
          paymentIntents: {
            where: {
              provider: PaymentProvider.SEPAY,
              status: PaymentIntentStatus.PENDING,
            },
          },
        },
      });
      if (!booking) {
        throw new NotFoundException('Không tìm thấy booking');
      }
      if (!isBookingPayable(booking)) {
        throw new ConflictException('Booking không còn khả dụng để thanh toán');
      }
      if (booking.totalSellPrice <= 0) {
        throw new UnprocessableEntityException(
          'Số tiền thanh toán không hợp lệ',
        );
      }

      if (booking.paymentIntents.length > 0) {
        await tx.paymentIntent.updateMany({
          where: {
            bookingId,
            provider: PaymentProvider.SEPAY,
            status: PaymentIntentStatus.PENDING,
          },
          data: {
            status: PaymentIntentStatus.EXPIRED,
          },
        });
      }

      const providerOrderCode = await this.generateProviderOrderCode(tx);
      const transferContent = `OPENFLY${providerOrderCode}`;
      const expiresAt = new Date(
        Date.now() + this.getIntentTtlMinutes() * 60 * 1000,
      );
      const qr = buildSepayQrUrl({
        transferContent,
        amount: booking.totalSellPrice,
      });
      const intent = await tx.paymentIntent.create({
        data: {
          bookingId: booking.id,
          provider: PaymentProvider.SEPAY,
          providerOrderCode,
          amount: booking.totalSellPrice,
          currency: 'VND',
          status: PaymentIntentStatus.PENDING,
          checkoutUrl: qr.qrUrl,
          qrCodeData: qr.qrUrl,
          accountNumber: qr.accountNumber,
          bin: qr.bankCode,
          expiresAt,
          rawCreatePayload: toJson({
            transferContent,
            qrTemplate:
              this.config.get<string>('SEPAY_QR_TEMPLATE') ?? 'compact',
            accountName: qr.accountName,
            bookingOrderCode: booking.orderCode,
          }),
        },
      });

      await tx.booking.update({
        where: {
          id: booking.id,
        },
        data: {
          status: BookingStatus.PAYMENT_PENDING,
        },
      });
      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: booking.id,
          eventType: 'PAYMENT_PENDING',
          title: 'Đã tạo QR thanh toán SePay',
          payload: toJson({
            paymentIntentId: intent.id,
            providerOrderCode,
            amount: intent.amount,
            expiresAt: expiresAt.toISOString(),
          }),
          occurredAt: new Date(),
        },
      });

      return {
        intent,
        qrUrl: qr.qrUrl,
        expiresAt,
      };
    });

    if (cacheKey) {
      await this.setCachedIntentResult(cacheKey, result);
    }

    return result;
  }

  async handleWebhook(
    payload: SepayWebhookPayload,
  ): Promise<SepayWebhookResult> {
    return this.prisma.$transaction(async (tx) => {
      const dedupeKey = buildDedupeKey(payload);
      const existing = await tx.bankTransaction.findUnique({
        where: {
          dedupeKey,
        },
      });
      if (existing) {
        return {
          status: 'DUPLICATE',
          bankTransactionId: existing.id,
        };
      }

      const amount = parseSepayAmount(payload.transferAmount);
      const receivedAt = parseSepayTransactionDate(payload.transactionDate);
      const content = payload.content ?? payload.description ?? '';

      if (payload.transferType !== 'in') {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: null,
          status: 'IGNORED',
          reason: 'TRANSFER_OUT',
          receivedAt,
        });
        return {
          status: 'IGNORED',
          bankTransactionId: bankTransaction.id,
          amount,
        };
      }

      const providerOrderCode = extractOrderCode(content);
      if (!providerOrderCode) {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: null,
          status: 'MANUAL_REVIEW',
          reason: 'NO_ORDER_CODE',
          receivedAt,
        });
        return {
          status: 'NO_ORDER_CODE',
          reason: 'NO_ORDER_CODE',
          bankTransactionId: bankTransaction.id,
          amount,
        };
      }

      const intent = await tx.paymentIntent.findFirst({
        where: {
          provider: PaymentProvider.SEPAY,
          providerOrderCode,
        },
        include: {
          booking: true,
        },
      });
      if (!intent) {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: providerOrderCode,
          status: 'MANUAL_REVIEW',
          reason: 'INTENT_NOT_FOUND',
          receivedAt,
        });
        return {
          status: 'INTENT_NOT_FOUND',
          reason: 'INTENT_NOT_FOUND',
          bankTransactionId: bankTransaction.id,
          orderCode: providerOrderCode,
          amount,
        };
      }

      if (!isBookingPayable(intent.booking)) {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: providerOrderCode,
          status: 'MANUAL_REVIEW',
          reason: 'BOOKING_NOT_PAYABLE',
          matchedIntentId: intent.id,
          receivedAt,
        });
        return {
          status: 'BOOKING_NOT_PAYABLE',
          reason: 'BOOKING_NOT_PAYABLE',
          bankTransactionId: bankTransaction.id,
          paymentIntentId: intent.id,
          bookingId: intent.bookingId,
          orderCode: providerOrderCode,
          amount,
        };
      }

      const expectedAmount = intent.booking.totalSellPrice;
      if (amount < expectedAmount) {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: providerOrderCode,
          status: 'PARTIAL',
          reason: 'PARTIAL',
          matchedIntentId: intent.id,
          receivedAt,
        });
        return {
          status: 'PARTIAL',
          reason: 'PARTIAL',
          bankTransactionId: bankTransaction.id,
          paymentIntentId: intent.id,
          bookingId: intent.bookingId,
          orderCode: providerOrderCode,
          amount,
        };
      }

      if (amount > expectedAmount) {
        const bankTransaction = await this.createBankTransaction(tx, {
          payload,
          dedupeKey,
          amount,
          reference: providerOrderCode,
          status: 'MANUAL_REVIEW',
          reason: 'OVERPAID',
          matchedIntentId: intent.id,
          receivedAt,
        });
        return {
          status: 'OVERPAID',
          reason: 'OVERPAID',
          bankTransactionId: bankTransaction.id,
          paymentIntentId: intent.id,
          bookingId: intent.bookingId,
          orderCode: providerOrderCode,
          amount,
        };
      }

      const paidAt = receivedAt ?? new Date();
      const payment = await tx.payment.create({
        data: {
          bookingId: intent.bookingId,
          paymentIntentId: intent.id,
          provider: PaymentProvider.SEPAY,
          amount,
          status: PaymentStatus.PAID,
          paidAt,
          transactionRef: String(payload.id),
        },
      });
      const bankTransaction = await this.createBankTransaction(tx, {
        payload,
        dedupeKey,
        amount,
        reference: providerOrderCode,
        status: 'MATCHED',
        reason: 'PAID',
        matchedIntentId: intent.id,
        receivedAt,
      });
      await tx.paymentIntent.update({
        where: {
          id: intent.id,
        },
        data: {
          status: PaymentIntentStatus.PAID,
        },
      });
      await tx.booking.update({
        where: {
          id: intent.bookingId,
        },
        data: {
          status: BookingStatus.PAID,
        },
      });
      await tx.bookingTimelineEvent.create({
        data: {
          bookingId: intent.bookingId,
          eventType: 'PAID',
          title: 'Đã nhận thanh toán SePay',
          payload: toJson({
            paymentId: payment.id,
            paymentIntentId: intent.id,
            bankTransactionId: bankTransaction.id,
            amount,
            providerOrderCode,
          }),
          occurredAt: paidAt,
        },
      });

      return {
        status: 'PAID',
        bankTransactionId: bankTransaction.id,
        paymentIntentId: intent.id,
        paymentId: payment.id,
        bookingId: intent.bookingId,
        orderCode: providerOrderCode,
        amount,
      };
    });
  }

  async cancelIntent(intentId: string): Promise<PaymentIntent> {
    return this.prisma.paymentIntent.update({
      where: {
        id: intentId,
      },
      data: {
        status: PaymentIntentStatus.EXPIRED,
      },
    });
  }

  private async generateProviderOrderCode(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = `${Math.floor(Date.now() / 1000)}${randomInt(0, 1000)
        .toString()
        .padStart(3, '0')}`;
      const existing = await tx.paymentIntent.findUnique({
        where: {
          providerOrderCode: code,
        },
        select: {
          id: true,
        },
      });
      if (!existing) {
        return code;
      }
    }

    throw new Error('Không tạo được mã thanh toán SePay duy nhất');
  }

  private getIntentTtlMinutes(): number {
    const value = Number(this.config.get<string>('SEPAY_INTENT_TTL_MINUTES'));
    return Number.isFinite(value) && value > 0 ? value : 15;
  }

  private async getCachedIntentResult(
    key: string,
  ): Promise<CreateSepayIntentResult | null> {
    try {
      return await this.redis.get<CreateSepayIntentResult>(key);
    } catch (error) {
      this.logger.warn(`Idempotency cache read skipped: ${safeError(error)}`);
      return null;
    }
  }

  private async setCachedIntentResult(
    key: string,
    value: CreateSepayIntentResult,
  ): Promise<void> {
    try {
      await this.redis.set(key, value, 300);
    } catch (error) {
      this.logger.warn(`Idempotency cache write skipped: ${safeError(error)}`);
    }
  }

  private async createBankTransaction(
    tx: Prisma.TransactionClient,
    input: {
      payload: SepayWebhookPayload;
      dedupeKey: string;
      amount: number;
      reference: string | null;
      status: string;
      reason: string;
      matchedIntentId?: string;
      receivedAt: Date | null;
    },
  ): Promise<BankTransaction> {
    return tx.bankTransaction.create({
      data: {
        provider: PaymentProvider.SEPAY,
        dedupeKey: input.dedupeKey,
        amount: input.amount,
        reference: input.reference,
        rawPayload: toJson({
          payload: input.payload,
          reason: input.reason,
          transactionDate: input.receivedAt?.toISOString() ?? null,
        }),
        matchedIntentId: input.matchedIntentId,
        status: input.status,
        receivedAt: input.receivedAt ?? new Date(),
      },
    });
  }
}

function isBookingPayable(
  booking: Pick<Booking, 'status' | 'paymentDeadline'>,
) {
  if (
    booking.status !== BookingStatus.HELD &&
    booking.status !== BookingStatus.PAYMENT_PENDING
  ) {
    return false;
  }
  if (!booking.paymentDeadline) {
    return false;
  }

  return booking.paymentDeadline.getTime() > Date.now();
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function safeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
