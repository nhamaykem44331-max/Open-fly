import { Inject, Injectable } from '@nestjs/common';
import {
  IMuadiProvider,
  MUADI_PROVIDER,
} from '../integrations/muadi/muadi-provider.interface';
import { SearchParamsDto } from '../integrations/muadi/dto/search-params.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FlightOfferDto } from './dto/flight-offer.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { normalizeFlight } from './normalizer';

@Injectable()
export class FlightsService {
  constructor(
    @Inject(MUADI_PROVIDER)
    private readonly muadiProvider: IMuadiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async search(dto: SearchParamsDto): Promise<SearchResponseDto> {
    const result = await this.muadiProvider.search(dto);
    const offers = result.rawFlights.map((flight) =>
      normalizeFlight(flight, flight.airline ?? flight.carrierCode ?? ''),
    );
    const returnOffers = result.returnRawFlights?.map((flight) =>
      normalizeFlight(flight, flight.airline ?? flight.carrierCode ?? ''),
    );

    await this.enrichOffers([...offers, ...(returnOffers ?? [])]);

    return {
      query: dto,
      offers,
      returnOffers,
      airlinesQueried: result.airlinesQueried,
      airlinesFailed: result.airlinesFailed,
      cached: false,
      fetchedAt: result.searchedAt,
    };
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
      if (airline) {
        offer.airline.name = airline.name;
      }

      offer.segments.forEach((segment) => {
        segment.from.city = airportByCode.get(segment.from.code)?.city;
        segment.to.city = airportByCode.get(segment.to.code)?.city;
      });
    });
  }
}
