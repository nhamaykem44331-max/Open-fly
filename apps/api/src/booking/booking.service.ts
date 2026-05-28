import { Inject, Injectable } from '@nestjs/common';
import { BookingStatus, MembershipTier, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  HoldResult,
  IMuadiProvider,
  MUADI_PROVIDER,
  MuadiRawFare,
  MuadiRawFlight,
} from '../integrations/muadi/muadi-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { parseMuadiDateTime } from '../flights/normalizer';
import { MarkupService } from '../pricing/markup.service';
import { buildBookRequest } from './book-request.builder';
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
  ) {}

  async hold(dto: HoldBookingDto, options: HoldBookingOptions = {}) {
    const flight = this.requireRawFlight(dto);
    const fare = this.resolveFare(dto, flight);
    const request = this.buildRequest(dto, flight, fare);

    if (options.dryRun) {
      return {
        dryRun: true,
        bookRequest: request,
      };
    }

    const holdResult = await this.muadiProvider.hold({
      bookRequest: request,
      sessionId: dto.sessionId,
    });

    return this.persistHeldBooking(
      dto,
      options,
      flight,
      fare,
      request,
      holdResult,
    );
  }

  private buildRequest(
    dto: HoldBookingDto,
    flight: MuadiRawFlight,
    fare: MuadiRawFare,
  ) {
    const firstSegment = flight.routeInfo?.[0];
    const lastSegment = flight.routeInfo?.[flight.routeInfo.length - 1];

    return buildBookRequest({
      sessionId: dto.sessionId,
      originCode: firstSegment?.from ?? flight.from ?? '',
      destinationCode: lastSegment?.to ?? flight.to ?? '',
      departureDateTime: getMuadiDateOnly(
        firstSegment?.departDate ?? flight.departDateTime,
      ),
      numberOfAdult: countPassengers(dto, 'ADT'),
      numberOfChildren: countPassengers(dto, 'CHD'),
      numberOfInfant: countPassengers(dto, 'INF'),
      flight,
      fare,
      passengers: dto.passengers,
      contact: dto.contact,
      isExportNow: false,
    });
  }

  private async persistHeldBooking(
    dto: HoldBookingDto,
    options: HoldBookingOptions,
    flight: MuadiRawFlight,
    fare: MuadiRawFare,
    bookRequest: Record<string, unknown>,
    holdResult: HoldResult,
  ) {
    if (!options.userId) {
      throw new Error('Thiếu userId để lưu booking HELD');
    }
    if (!options.vat) {
      throw new Error('Thiếu thông tin VAT để lưu booking HELD');
    }

    const firstSegment = flight.routeInfo?.[0];
    const lastSegment = flight.routeInfo?.[flight.routeInfo.length - 1];
    const firstPnr = holdResult.pnrs[0];
    const muadiHoldExpiresAt = parseTimelimit(firstPnr?.timelimit);
    const paymentDeadline = muadiHoldExpiresAt
      ? new Date(muadiHoldExpiresAt.getTime() - 60 * 60 * 1000)
      : null;
    const totals = computeTotals(dto, fare, flight);
    const fromCode = firstSegment?.from ?? flight.from ?? '';
    const toCode = lastSegment?.to ?? flight.to ?? '';
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
      netPrice: totals.total,
    });

    return this.prisma.booking.create({
      data: {
        orderCode: generateOrderCode(),
        userId: options.userId,
        status: BookingStatus.HELD,
        pnr: firstPnr?.pnr,
        sessionId: String(dto.sessionId),
        airline: flight.airline,
        flightNumber: buildFlightNumber(firstSegment, flight),
        aircraft:
          firstSegment?.airCraft ?? firstSegment?.aircraft ?? flight.aircraft,
        fromCode,
        toCode,
        departTime: new Date(
          parseMuadiDateTime(
            requiredDate(firstSegment?.departDate ?? flight.departDateTime),
          ),
        ),
        arriveTime: lastSegment?.arrivalDate
          ? new Date(parseMuadiDateTime(lastSegment.arrivalDate))
          : null,
        duration: getDuration(firstSegment),
        cabin,
        totalNetPrice: totals.total,
        totalSellPrice: markup.sellPrice,
        totalMarkup: markup.markupAmount,
        appliedMarkupRuleId: markup.ruleId,
        appliedMarkupRuleSnapshot: markup.ruleSnapshot
          ? toJson(markup.ruleSnapshot)
          : undefined,
        tax: totals.tax,
        fee: totals.fee,
        vatCompanyName: options.vat.companyName,
        vatTaxId: options.vat.taxId,
        vatAddress: options.vat.address,
        vatEmail: options.vat.email ?? dto.contact.email,
        priceLockedAt: new Date(),
        ttlExpiresAt: muadiHoldExpiresAt,
        muadiHoldExpiresAt,
        paymentDeadline,
        rawMuadiJson: toJson({
          bookRequest,
          bookingResponse: holdResult.bookingResponse,
          ticketInfo: holdResult.ticketInfo,
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
            timelimit: parseTimelimit(pnr.timelimit),
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
                timelimit: pnr.timelimit,
              })),
              paymentDeadline: paymentDeadline?.toISOString() ?? null,
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

  private requireRawFlight(dto: HoldBookingDto): MuadiRawFlight {
    if (!dto.rawFlight) {
      throw new Error('rawFlight là bắt buộc cho hold core ở Task 1');
    }

    return dto.rawFlight;
  }

  private resolveFare(
    dto: HoldBookingDto,
    flight: MuadiRawFlight,
  ): MuadiRawFare {
    const fare =
      dto.rawFare ??
      flight.priceInfo?.find((item) => item.class === dto.fareClass);
    if (!fare) {
      throw new Error('Không tìm thấy fare class trong dữ liệu Muadi');
    }

    return fare;
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

function computeTotals(
  dto: HoldBookingDto,
  fare: MuadiRawFare,
  flight: MuadiRawFlight,
): { total: number; tax: number; fee: number } {
  const adultCount = countPassengers(dto, 'ADT');
  const childCount = countPassengers(dto, 'CHD');
  const infantCount = countPassengers(dto, 'INF');
  const adultFee = money(fare.issueFeeADT ?? flight.issueFeeADT);
  const childFee = money(flight.issueFeeCHD);
  const tax =
    adultCount * (money(fare.taxADT) + money(fare.vatADT)) +
    childCount * (money(fare.taxCHD) + money(fare.vatCHD)) +
    infantCount * (money(fare.taxINF) + money(fare.vatINF));
  const fee = adultCount * adultFee + childCount * childFee;
  const total =
    adultCount * money(fare.fareADT) +
    childCount * money(fare.fareCHD) +
    infantCount * money(fare.fareINF) +
    tax +
    fee;

  return {
    total,
    tax,
    fee,
  };
}

function countPassengers(dto: HoldBookingDto, type: 'ADT' | 'CHD' | 'INF') {
  return dto.passengers.filter((passenger) => passenger.type === type).length;
}

function getMuadiDateOnly(value: string | undefined): string {
  if (!value) {
    return '';
  }

  return value.split(' ')[0];
}

function buildFlightNumber(
  segment: { carrierCode?: string; flightNumber?: string } | undefined,
  flight: MuadiRawFlight,
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
