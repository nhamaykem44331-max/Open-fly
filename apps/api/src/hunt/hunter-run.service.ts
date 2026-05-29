import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Hunt, HuntStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { FlightOfferDto } from '../flights/dto/flight-offer.dto';
import { FlightsService } from '../flights/flights.service';
import { NoHunterHeadroomError } from '../integrations/muadi/muadi-provider.interface';
import { NotifierService } from '../notifier/notifier.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutoHoldService } from './auto-hold.service';
import { compareHuntResults, HuntResultItem } from './hunter-diff';
import { HUNT_RUN_QUEUE } from './hunt.service';

const FAILURE_THRESHOLD = 5;
const NO_SESSION_BACKOFF_MS = 2 * 60_000;
const HISTORY_WINDOW_DAYS = 30;

interface ScanItem {
  item: HuntResultItem;
  offerId: string;
  fareClass: string;
  airline: string;
  departDate: Date;
  netPriceVnd: number;
}

@Injectable()
export class HunterRunService {
  private readonly logger = new Logger(HunterRunService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flights: FlightsService,
    private readonly autoHold: AutoHoldService,
    private readonly notifier: NotifierService,
    private readonly config: ConfigService,
    @InjectQueue(HUNT_RUN_QUEUE) private readonly queue: Queue,
  ) {}

  async run(huntId: string): Promise<void> {
    const hunt = await this.prisma.hunt.findUnique({ where: { id: huntId } });
    if (!hunt || hunt.status !== HuntStatus.HUNTING) {
      return; // paused/cancelled/found -> bỏ qua (job cũ còn sót)
    }

    const startedAt = new Date();
    try {
      // FlightsService.search(priority:'hunter') tự chừa headroom session cho
      // real-time (acquireForHunter). Hết headroom -> NoHunterHeadroomError.
      const scanned = await this.scan(hunt);
      await this.persistAndDecide(hunt, scanned, startedAt);
    } catch (error) {
      if (error instanceof NoHunterHeadroomError) {
        await this.enqueueNext(huntId, NO_SESSION_BACKOFF_MS);
        return; // hoãn, KHÔNG tính là thất bại
      }
      await this.handleFailure(hunt, startedAt, error);
    }
  }

  private async scan(hunt: Hunt): Promise<ScanItem[]> {
    const days = resolveDays(hunt, this.maxDaysPerRun());
    const airlineFilter = new Set(
      (hunt.airlines ?? []).map((a) => a.toUpperCase()),
    );
    const scanned: ScanItem[] = [];

    for (const day of days) {
      const response = await this.flights.search(
        {
          origin: hunt.fromCode,
          destination: hunt.toCode,
          date: day,
          paxAdt: hunt.pax,
          paxChd: 0,
          paxInf: 0,
        } as never,
        { priority: 'hunter' },
      );

      for (const offer of response.offers) {
        if (
          airlineFilter.size > 0 &&
          !airlineFilter.has(offer.airline.code.toUpperCase())
        ) {
          continue;
        }
        const fare = cheapestFare(offer);
        if (!fare) {
          continue;
        }
        scanned.push({
          item: {
            flightNumber: offer.flightNumber,
            departTime: offer.segments[0]?.departTime ?? day,
            sellPriceVnd: fare.priceVnd,
            seatAvailable: fare.seatAvailable ?? null,
          },
          offerId: offer.id,
          fareClass: fare.code,
          airline: offer.airline.code,
          departDate: new Date(`${day}T00:00:00.000Z`),
          netPriceVnd: (fare.baseFareVnd ?? 0) + (fare.taxesFeesVnd ?? 0),
        });
      }
    }

    return scanned;
  }

  private async persistAndDecide(
    hunt: Hunt,
    scanned: ScanItem[],
    startedAt: Date,
  ): Promise<void> {
    const items = scanned.map((s) => s.item);
    const cheapest = pickCheapestBookable(scanned);
    const historicalLow = await this.historicalLowVnd(hunt);
    const prevItems = await this.previousItems(hunt.id);
    const diff = compareHuntResults(prevItems, items, {
      targetPriceVnd: hunt.targetPrice,
      historicalLowVnd: historicalLow ?? undefined,
    });

    const run = await this.prisma.huntRun.create({
      data: {
        huntId: hunt.id,
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        resultCount: items.length,
        cheapestPrice: cheapest?.item.sellPriceVnd ?? null,
        cheapestDate: cheapest?.departDate ?? null,
        rawResults: toJson(items),
        diffSummary: toJson(diff),
      },
    });

    await this.writeObservations(hunt, scanned, run.id);

    let triggeredNotif = false;
    let nextStatus: HuntStatus = HuntStatus.HUNTING;

    if (diff.hitTarget && cheapest) {
      if (hunt.autoHoldEnabled) {
        const result = await this.autoHold.execute(hunt, {
          offerId: cheapest.offerId,
          fareClass: cheapest.fareClass,
        });
        if (result.held) {
          triggeredNotif = true;
          nextStatus = HuntStatus.PAUSED; // auto-hold đã pause hunt
        } else {
          await this.notifyFound(hunt, cheapest);
          triggeredNotif = true;
          nextStatus = HuntStatus.FOUND;
        }
      } else {
        await this.notifyFound(hunt, cheapest);
        triggeredNotif = true;
        nextStatus = HuntStatus.FOUND;
      }
    } else if (prevItems !== null && isSignificant(diff)) {
      // Chỉ báo "giá đang giảm" khi đã có lần quét trước để so (tránh spam scan đầu).
      await this.notifyProgress(hunt, cheapest);
      triggeredNotif = true;
    }

    await this.updateHuntAfterRun(hunt, cheapest, items.length, nextStatus);
    if (triggeredNotif) {
      await this.prisma.huntRun.update({
        where: { id: run.id },
        data: { triggeredNotif: true },
      });
    }

    if (nextStatus === HuntStatus.HUNTING) {
      await this.enqueueNext(hunt.id, hunt.intervalMinutes * 60_000);
    }
  }

  private async updateHuntAfterRun(
    hunt: Hunt,
    cheapest: ScanItem | null,
    resultCount: number,
    nextStatus: HuntStatus,
  ): Promise<void> {
    const data: Prisma.HuntUpdateInput = {
      lastRunAt: new Date(),
      scansCount: { increment: 1 },
      failureStreak: 0,
      emptyStreak: resultCount === 0 ? { increment: 1 } : 0,
    };
    if (nextStatus !== hunt.status) {
      data.status = nextStatus;
    }
    if (nextStatus === HuntStatus.HUNTING) {
      data.nextRunAt = new Date(Date.now() + hunt.intervalMinutes * 60_000);
    }
    // Auto-hold tự cập nhật bestPrice; chỉ cập nhật ở đây nếu chưa pause vì hold.
    if (
      nextStatus !== HuntStatus.PAUSED &&
      cheapest &&
      (hunt.bestPriceFound == null ||
        cheapest.item.sellPriceVnd < hunt.bestPriceFound)
    ) {
      data.bestPriceFound = cheapest.item.sellPriceVnd;
      data.bestPriceDate = cheapest.departDate;
    }

    await this.prisma.hunt.update({ where: { id: hunt.id }, data });
  }

  private async handleFailure(
    hunt: Hunt,
    startedAt: Date,
    error: unknown,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Hunt ${hunt.id} quét lỗi: ${message}`);
    await this.prisma.huntRun.create({
      data: {
        huntId: hunt.id,
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        resultCount: 0,
        error: message.slice(0, 500),
      },
    });

    const streak = hunt.failureStreak + 1;
    if (streak >= FAILURE_THRESHOLD) {
      await this.prisma.hunt.update({
        where: { id: hunt.id },
        data: {
          status: HuntStatus.PAUSED,
          failureStreak: streak,
          autoDisabledAt: new Date(),
          autoDisabledReason: `Lỗi quét ${streak} lần liên tiếp`,
        },
      });
      await this.notifier.enqueue({
        userId: hunt.userId,
        kind: 'SYSTEM',
        huntId: hunt.id,
        payload: {
          title: 'Đã tạm dừng săn vé',
          body: `Săn vé ${hunt.fromCode}-${hunt.toCode} tạm dừng do lỗi liên tiếp. Bạn có thể bật lại trong ứng dụng.`,
        },
        requestedChannels: hunt.channels,
      });
      return;
    }

    await this.prisma.hunt.update({
      where: { id: hunt.id },
      data: { failureStreak: streak, lastRunAt: new Date() },
    });
    await this.enqueueNext(hunt.id, hunt.intervalMinutes * 60_000);
  }

  private async writeObservations(
    hunt: Hunt,
    scanned: ScanItem[],
    runId: string,
  ): Promise<void> {
    if (scanned.length === 0) {
      return;
    }
    await this.prisma.routePriceObservation.createMany({
      data: scanned.map((s) => ({
        fromCode: hunt.fromCode,
        toCode: hunt.toCode,
        departDate: s.departDate,
        airline: s.airline,
        flightNumber: s.item.flightNumber,
        cabin: hunt.cabin,
        fareClass: s.fareClass,
        netPriceVnd: s.netPriceVnd,
        sellPriceVnd: s.item.sellPriceVnd,
        seatAvailable: s.item.seatAvailable,
        huntRunId: runId,
        source: 'hunt',
      })),
    });
  }

  private async historicalLowVnd(hunt: Hunt): Promise<number | null> {
    const since = new Date(Date.now() - HISTORY_WINDOW_DAYS * 24 * 60 * 60_000);
    const agg = await this.prisma.routePriceObservation.aggregate({
      where: {
        fromCode: hunt.fromCode,
        toCode: hunt.toCode,
        observedAt: { gte: since },
        seatAvailable: { gt: 0 },
      },
      _min: { sellPriceVnd: true },
    });

    return agg._min.sellPriceVnd ?? null;
  }

  private async previousItems(huntId: string): Promise<HuntResultItem[] | null> {
    const prev = await this.prisma.huntRun.findFirst({
      where: { huntId, error: null },
      orderBy: { startedAt: 'desc' },
      select: { rawResults: true },
    });
    if (!prev?.rawResults || !Array.isArray(prev.rawResults)) {
      return null;
    }

    return prev.rawResults as unknown as HuntResultItem[];
  }

  private notifyFound(hunt: Hunt, cheapest: ScanItem): Promise<string> {
    return this.notifier.enqueue({
      userId: hunt.userId,
      kind: 'HUNT_FOUND',
      huntId: hunt.id,
      payload: {
        autoHeld: false,
        route: `${hunt.fromCode}-${hunt.toCode}`,
        price: cheapest.item.sellPriceVnd,
        offerId: cheapest.offerId,
        fareClass: cheapest.fareClass,
      },
      requestedChannels: hunt.channels,
    });
  }

  private notifyProgress(hunt: Hunt, cheapest: ScanItem | null): Promise<string> {
    return this.notifier.enqueue({
      userId: hunt.userId,
      kind: 'HUNT_PROGRESS',
      huntId: hunt.id,
      payload: {
        route: `${hunt.fromCode}-${hunt.toCode}`,
        price: cheapest?.item.sellPriceVnd ?? null,
      },
      requestedChannels: hunt.channels,
    });
  }

  private enqueueNext(huntId: string, delayMs: number): Promise<unknown> {
    return this.queue.add(
      'scan',
      { huntId },
      { delay: delayMs, removeOnComplete: true },
    );
  }

  private maxDaysPerRun(): number {
    const value = Number(this.config.get<string>('HUNTER_MAX_DAYS_PER_RUN'));
    return Number.isInteger(value) && value > 0 ? value : 31;
  }
}

export function resolveDays(hunt: Hunt, maxDays: number): string[] {
  const start = new Date(hunt.windowStart);
  if (hunt.flexibility === 'EXACT_DATE') {
    return [isoDay(start)];
  }

  const end = new Date(hunt.windowEnd);
  const days: string[] = [];
  const cursor = new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    ),
  );
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (cursor.getTime() <= last && days.length < maxDays) {
    days.push(isoDay(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days.length > 0 ? days : [isoDay(start)];
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function cheapestFare(offer: FlightOfferDto): FlightOfferDto['fareClasses'][number] | null {
  const bookable = offer.fareClasses.filter(
    (f) => !f.soldOut && (f.seatAvailable ?? 0) > 0,
  );
  const pool = bookable.length > 0 ? bookable : offer.fareClasses;
  if (pool.length === 0) {
    return null;
  }

  return pool.reduce((min, f) => (f.priceVnd < min.priceVnd ? f : min));
}

function pickCheapestBookable(scanned: ScanItem[]): ScanItem | null {
  const bookable = scanned.filter(
    (s) => s.item.seatAvailable == null || s.item.seatAvailable > 0,
  );
  if (bookable.length === 0) {
    return null;
  }

  return bookable.reduce((min, s) =>
    s.item.sellPriceVnd < min.item.sellPriceVnd ? s : min,
  );
}

function isSignificant(diff: ReturnType<typeof compareHuntResults>): boolean {
  return (
    diff.isHistoricalLow ||
    diff.newFlights > 0 ||
    (diff.priceDown.count > 0 && diff.priceDown.avgPercent >= 5)
  );
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
