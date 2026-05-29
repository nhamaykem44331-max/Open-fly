import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IMuadiProvider,
  MUADI_PROVIDER,
  MuadiRawFlight,
  SearchOptions,
} from '../integrations/muadi/muadi-provider.interface';
import { SearchParamsDto } from '../integrations/muadi/dto/search-params.dto';
import { RedisService } from '../integrations/redis/redis.service';
import { MarkupService } from '../pricing/markup.service';
import { PrismaService } from '../prisma/prisma.service';
import { FlightOfferDto } from './dto/flight-offer.dto';
import { offerSnapshotKey, OfferSnapshot } from './offer-snapshot';
import { SearchResponseDto } from './dto/search-response.dto';
import { normalizeFlight } from './normalizer';

@Injectable()
export class FlightsService {
  private readonly logger = new Logger(FlightsService.name);
  private readonly inflight = new Map<string, Promise<SearchResponseDto>>();

  constructor(
    @Inject(MUADI_PROVIDER)
    private readonly muadiProvider: IMuadiProvider,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly markupService: MarkupService,
  ) {}

  async search(
    dto: SearchParamsDto,
    options?: SearchOptions,
  ): Promise<SearchResponseDto> {
    const cacheKey = this.buildCacheKey(dto);
    const cached = await this.getCachedResponse(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
      };
    }

    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing;
    }

    const promise = this.fetchAndCache(dto, cacheKey, options).finally(() => {
      this.inflight.delete(cacheKey);
    });
    this.inflight.set(cacheKey, promise);

    return promise;
  }

  private async fetchAndCache(
    dto: SearchParamsDto,
    cacheKey: string,
    options?: SearchOptions,
  ): Promise<SearchResponseDto> {
    const result = await this.muadiProvider.search(dto, options);
    const offers = result.rawFlights.map((flight) =>
      normalizeFlight(flight, flight.airline ?? flight.carrierCode ?? ''),
    );
    const returnOffers = result.returnRawFlights?.map((flight) =>
      normalizeFlight(flight, flight.airline ?? flight.carrierCode ?? ''),
    );

    await this.enrichOffers([...offers, ...(returnOffers ?? [])]);
    await this.saveOfferSnapshots(
      offers,
      result.rawFlights,
      dto,
    );
    if (returnOffers && result.returnRawFlights) {
      await this.saveOfferSnapshots(
        returnOffers,
        result.returnRawFlights,
        dto,
      );
    }
    await this.markupService.applyMarkupToOffers(
      [...offers, ...(returnOffers ?? [])],
      {
        channel: 'B2C',
        tier: null,
        paxType: 'ADT',
      },
    );

    const response: SearchResponseDto = {
      query: dto,
      offers,
      returnOffers,
      airlinesQueried: result.airlinesQueried,
      airlinesFailed: result.airlinesFailed,
      cached: false,
      fetchedAt: result.searchedAt,
    };

    await this.setCachedResponse(cacheKey, response);

    return response;
  }

  private async enrichOffers(offers: FlightOfferDto[]): Promise<void> {
    const airportCodes = Array.from(
      new Set(
        offers.flatMap((offer) =>
          offer.segments.flatMap((segment) => [
            segment.from.code,
            segment.to.code,
          ]),
        ),
      ),
    );
    const airlineCodes = Array.from(
      new Set(offers.map((offer) => offer.airline.code)),
    );

    const [airports, airlines] = await Promise.all([
      airportCodes.length > 0
        ? this.prisma.airport.findMany({
            where: {
              code: {
                in: airportCodes,
              },
              active: true,
            },
          })
        : [],
      airlineCodes.length > 0
        ? this.prisma.airline.findMany({
            where: {
              code: {
                in: airlineCodes,
              },
              active: true,
            },
          })
        : [],
    ]);

    const airportByCode = new Map(
      airports.map((airport) => [airport.code, airport]),
    );
    const airlineByCode = new Map(
      airlines.map((airline) => [airline.code, airline]),
    );

    offers.forEach((offer) => {
      const airline = airlineByCode.get(offer.airline.code);
      if (
        airline &&
        (!offer.airline.name || offer.airline.name === offer.airline.code)
      ) {
        offer.airline.name = airline.name;
      }

      offer.segments.forEach((segment) => {
        segment.from.city =
          segment.from.city ?? airportByCode.get(segment.from.code)?.city;
        segment.to.city =
          segment.to.city ?? airportByCode.get(segment.to.code)?.city;
      });
    });
  }

  private buildCacheKey(dto: SearchParamsDto): string {
    const origin = dto.origin.trim().toUpperCase();
    const destination = dto.destination.trim().toUpperCase();
    const date = dto.date.trim();

    return [
      'flights',
      'search',
      origin,
      destination,
      date,
      dto.paxAdt,
      dto.paxChd,
      dto.paxInf,
    ].join(':');
  }

  private async getCachedResponse(
    cacheKey: string,
  ): Promise<SearchResponseDto | null> {
    try {
      return await this.redis.get<SearchResponseDto>(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Flight search cache read skipped for ${cacheKey}: ${this.safeError(error)}`,
      );
      return null;
    }
  }

  private async setCachedResponse(
    cacheKey: string,
    response: SearchResponseDto,
  ): Promise<void> {
    try {
      await this.redis.set(cacheKey, response, this.getCacheTtlSeconds());
    } catch (error) {
      this.logger.warn(
        `Flight search cache write skipped for ${cacheKey}: ${this.safeError(error)}`,
      );
    }
  }

  private getCacheTtlSeconds(): number {
    const value = Number(
      this.config.get<string>('FLIGHT_SEARCH_CACHE_TTL_SECONDS'),
    );

    return Number.isFinite(value) && value > 0 ? value : 60;
  }

  private async saveOfferSnapshots(
    offers: FlightOfferDto[],
    rawFlights: unknown[],
    dto: SearchParamsDto,
  ): Promise<void> {
    await Promise.all(
      offers.map(async (offer, index) => {
        const rawFlight = rawFlights[index];
        if (!rawFlight) {
          return;
        }

        const snapshot = buildOfferSnapshot(
          offer,
          rawFlight as MuadiRawFlight,
          dto,
        );
        try {
          await this.redis.set(
            offerSnapshotKey(offer.id),
            snapshot,
            this.getOfferSnapshotTtlSeconds(),
          );
        } catch (error) {
          this.logger.warn(
            `Offer snapshot write skipped for ${offer.id}: ${this.safeError(error)}`,
          );
        }
      }),
    );
  }

  private getOfferSnapshotTtlSeconds(): number {
    const value = Number(
      this.config.get<string>('MUADI_OFFER_SNAPSHOT_TTL_SECONDS'),
    );

    return Number.isFinite(value) && value > 0 ? value : 900;
  }

  private safeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}

function buildOfferSnapshot(
  offer: FlightOfferDto,
  rawFlight: MuadiRawFlight,
  dto: SearchParamsDto,
): OfferSnapshot {
  const firstSegment = offer.segments[0];
  const cheapestFare =
    offer.fareClasses.find(
      (fareClass) =>
        !fareClass.soldOut && fareClass.priceVnd === offer.cheapestPriceVnd,
    ) ??
    offer.fareClasses.find((fareClass) => !fareClass.soldOut) ??
    offer.fareClasses[0];

  return {
    from: dto.origin.trim().toUpperCase(),
    to: dto.destination.trim().toUpperCase(),
    date: dto.date.trim(),
    paxAdt: dto.paxAdt,
    paxChd: dto.paxChd,
    paxInf: dto.paxInf,
    airline: offer.airline.code || rawFlight.airline || '',
    flightNumber: offer.flightNumber,
    departDate: firstSegment?.departTime ?? rawFlight.departDateTime ?? '',
    fareClass: cheapestFare?.code ?? '',
    snapshotPriceVnd: cheapestFare?.priceVnd ?? offer.cheapestPriceVnd,
  };
}
