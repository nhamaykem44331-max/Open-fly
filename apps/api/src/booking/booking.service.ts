import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, MembershipTier, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  HoldResult,
  IMuadiProvider,
  MUADI_PROVIDER,
} from '../integrations/muadi/muadi-provider.interface';
import { RedisService } from '../integrations/redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { parseMuadiDateTime } from '../flights/normalizer';
import { OfferSnapshot, offerSnapshotKey } from '../flights/offer-snapshot';
import { MarkupService } from '../pricing/markup.service';
import { HoldBookingDto } from './dto/hold-booking.dto';

export interface HoldBookingOptions {
  dryRun?: boolean;
  userId?: string;
  vat?: {
    companyName: string;
    taxId: string;
    address: string;
    email?: string;
  };
}

@Injectable()
export class BookingService {
  constructor(
    @Inject(MUADI_PROVIDER)
    private readonly muadiProvider: IMuadiProvider,
    private readonly prisma: PrismaService,
    private readonly markupService: MarkupService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async hold(dto: HoldBookingDto, options: HoldBookingOptions = {}) {
    if (!options.dryRun && !options.userId) {
      throw new Error('Thiếu userId để lưu booking HELD');
    }

    const snapshot = await this.loadOfferSnapshot(dto.offerId);
    if (options.dryRun) {
      return {
        dryRun: true,
        snapshot,
      };
    }

    const holdResult = await this.muadiProvider.hold({
      snapshot,
      fareClass: dto.fareClass,
      passengers: dto.passengers,
      contact: dto.contact,
    });

    return this.persistHeldBooking(dto, options, snapshot, holdResult);
  }

  private async persistHeldBooking(
    dto: HoldBookingDto,
    options: HoldBookingOptions,
    snapshot: OfferSnapshot,
    holdResult: HoldResult,
  ) {
    if (!options.userId) {
      throw new Error('Thiếu userId để lưu booking HELD');
    }

    const flight = holdResult.flight;
    const fare = holdResult.fare;
    const firstSegment = flight.routeInfo?.[0];
    const lastSegment = flight.routeInfo?.[flight.routeInfo.length - 1];
    const firstPnr = holdResult.pnrs[0];
    const departTime = new Date(
      parseMuadiDateTime(
        requiredDate(firstSegment?.departDate ?? flight.departDateTime),
      ),
    );
    const muadiHoldExpiresAt = this.resolveHoldExpiresAt(
      holdResult,
      departTime,
    );
    const paymentDeadline = new Date(
      muadiHoldExpiresAt.getTime() - this.getPaymentBufferMinutes() * 60_000,
    );
    this.assertPaymentWindow(paymentDeadline);

    const totalNetPrice = holdResult.pricing.totalNetPrice;
    const fromCode = firstSegment?.from ?? flight.from ?? snapshot.from;
    const toCode = lastSegment?.to ?? flight.to ?? snapshot.to;
    const cabin = fare.fareInfo?.[0]?.cabinClass?.toLowerCase() ?? 'economy';
    const tier = await this.resolveUserTier(options.userId);
    const domestic = await this.markupService.classifyDomestic(
      fromCode,
      toCode,
    );
    const markup = await this.markupService.computeForFareClass({
      airlineCode: flight.airline ?? firstSegment?.carrierCode ?? '',
      channel: 'B2C',
      cabin,
      paxType: 'ADT',
      domestic,
      tier,
      route: fromCode && toCode ? `${fromCode}-${toCode}` : null,
      netPrice: totalNetPrice,
    });

    return this.prisma.booking.create({
      data: {
        orderCode: generateOrderCode(),
        userId: options.userId,
        status: BookingStatus.HELD,
        pnr: firstPnr?.pnr,
        sessionId: String(holdResult.muadiSessionId),
        airline: flight.airline,
        flightNumber: buildFlightNumber(firstSegment, flight),
        aircraft:
          firstSegment?.airCraft ?? firstSegment?.aircraft ?? flight.aircraft,
        fromCode,
        toCode,
        departTime,
        arriveTime: lastSegment?.arrivalDate
          ? new Date(parseMuadiDateTime(lastSegment.arrivalDate))
          : null,
        duration: getDuration(firstSegment),
        cabin,
        totalNetPrice,
        totalSellPrice: markup.sellPrice,
        totalMarkup: markup.markupAmount,
        appliedMarkupRuleId: markup.ruleId,
        appliedMarkupRuleSnapshot: markup.ruleSnapshot
          ? toJson(markup.ruleSnapshot)
          : undefined,
        tax: 0,
        fee: 0,
        vatCompanyName: options.vat?.companyName ?? null,
        vatTaxId: options.vat?.taxId ?? null,
        vatAddress: options.vat?.address ?? null,
        vatEmail: options.vat ? (options.vat.email ?? dto.contact.email) : null,
        priceLockedAt: new Date(),
        ttlExpiresAt: muadiHoldExpiresAt,
        muadiHoldExpiresAt,
        paymentDeadline,
        rawMuadiJson: toJson({
          bookRequest: holdResult.bookRequest,
          bookingResponse: holdResult.bookingResponse,
          ticketInfo: holdResult.ticketInfo,
          pricing: holdResult.pricing,
          snapshot,
          priceChanged: holdResult.priceChanged,
          protectionVerified: holdResult.protectionVerified,
        }),
        contactEmail: dto.contact.email,
        contactPhone: dto.contact.phone,
        passengers: {
          create: dto.passengers.map((passenger) => ({
            fullName: `${passenger.lastName} ${passenger.firstName}`.trim(),
            dob: passenger.dob
              ? new Date(`${passenger.dob}T00:00:00.000Z`)
              : null,
            isChild: passenger.type !== 'ADT',
          })),
        },
        pnrs: {
          create: holdResult.pnrs.map((pnr) => ({
            airline: pnr.airline,
            pnr: pnr.pnr,
            timelimit: parseTimelimit(pnr.timelimit) ?? muadiHoldExpiresAt,
            rawJson: toJson(pnr.rawJson ?? pnr),
          })),
        },
        timeline: {
          create: {
            eventType: 'HELD',
            title: 'Đã giữ chỗ thành công',
            payload: toJson({
              pnrs: holdResult.pnrs.map((pnr) => ({
                airline: pnr.airline,
                pnr: pnr.pnr,
                timelimit:
                  pnr.timelimit ?? muadiHoldExpiresAt.toISOString(),
                total: pnr.total ?? null,
              })),
              paymentDeadline: paymentDeadline.toISOString(),
              pricing: {
                source: holdResult.pricing.source,
                totalNetPrice,
                snapshotPriceVnd: holdResult.snapshotPriceVnd,
                priceChanged: holdResult.priceChanged,
              },
              markup: {
                ruleId: markup.ruleId,
                ruleName: markup.ruleName,
                markupAmount: markup.markupAmount,
                sellPrice: markup.sellPrice,
              },
            }),
            occurredAt: new Date(),
          },
        },
      },
      include: {
        passengers: true,
        pnrs: true,
        timeline: true,
      },
    });
  }

  private async loadOfferSnapshot(offerId: string): Promise<OfferSnapshot> {
    let snapshot: OfferSnapshot | null = null;
    try {
      snapshot = await this.redis.get<OfferSnapshot>(offerSnapshotKey(offerId));
    } catch {
      snapshot = null;
    }
    if (!snapshot?.flightNumber || !snapshot.airline || !snapshot.date) {
      throw new GoneException('Vé đã hết hạn giữ, vui lòng tìm lại');
    }

    return snapshot;
  }

  private async resolveUserTier(
    userId: string | undefined,
  ): Promise<MembershipTier | null> {
    if (!userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        tier: true,
      },
    });

    return user?.tier ?? null;
  }

  private resolveHoldExpiresAt(
    holdResult: HoldResult,
    departTime: Date,
  ): Date {
    const parsedTimelimits = holdResult.pnrs
      .map((pnr) => parseTimelimit(pnr.timelimit))
      .filter((value): value is Date => value !== null)
      .sort((left, right) => left.getTime() - right.getTime());
    if (parsedTimelimits[0]) {
      return parsedTimelimits[0];
    }

    const fallbackHours = this.getNumberConfig('MUADI_HOLD_FALLBACK_HOURS', 4);
    const fallbackFromNow = new Date(Date.now() + fallbackHours * 60 * 60_000);
    const fallbackBeforeDepart = new Date(
      departTime.getTime() - 3 * 60 * 60_000,
    );

    return fallbackFromNow.getTime() < fallbackBeforeDepart.getTime()
      ? fallbackFromNow
      : fallbackBeforeDepart;
  }

  private assertPaymentWindow(paymentDeadline: Date): void {
    const minWindowMs =
      this.getNumberConfig('MIN_PAYMENT_WINDOW_MINUTES', 15) * 60_000;
    if (paymentDeadline.getTime() <= Date.now() + minWindowMs) {
      throw new ConflictException(
        'Vé này có thời hạn giữ chỗ quá ngắn, vui lòng chọn chuyến khác hoặc thanh toán ngay',
      );
    }
  }

  private getPaymentBufferMinutes(): number {
    return this.getNumberConfig('PAYMENT_BUFFER_MINUTES', 60);
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}

export function parseTimelimit(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(value)) {
    return new Date(parseMuadiDateTime(value));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildFlightNumber(
  segment: { carrierCode?: string; flightNumber?: string } | undefined,
  flight: { carrierCode?: string; airline?: string; flightNumber?: string },
): string | undefined {
  const carrier = segment?.carrierCode ?? flight.carrierCode ?? flight.airline;
  const number = segment?.flightNumber ?? flight.flightNumber;
  if (!carrier || !number) {
    return number;
  }

  return `${carrier}${number}`;
}

function getDuration(
  segment: { flightTimeHour?: number; flightTimeMinute?: number } | undefined,
): string | undefined {
  if (!segment) {
    return undefined;
  }
  const minutes =
    money(segment.flightTimeHour) * 60 + money(segment.flightTimeMinute);

  return minutes > 0 ? `${minutes}m` : undefined;
}

function requiredDate(value: string | undefined): string {
  if (!value) {
    throw new Error('Thiếu ngày giờ bay trong dữ liệu Muadi');
  }

  return value;
}

function money(value: number | undefined): number {
  return Number(value || 0);
}

function generateOrderCode(): string {
  return `OFY${randomBytes(4).toString('hex').toUpperCase()}`;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
